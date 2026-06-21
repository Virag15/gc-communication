<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\Process\ExecutableFinder;

/**
 * Local "price list → catalogue" workflow, driven from the admin panel so the
 * user never touches the terminal. Renders each PDF page and OCRs it with Apple
 * Vision (tools/pricelist-ocr), then imports the resulting CSV straight from disk.
 *
 * macOS-only and intended for local use (it shells out to the converter on the
 * same machine the app runs on).
 */
class PriceListController extends Controller
{
    private function toolDir(): string { return base_path('tools/pricelist-ocr'); }
    private function pdfDir(): string { return base_path('price-list'); }
    private function outDir(): string { return $this->toolDir().'/out'; }
    private function logDir(): string { return storage_path('app/pricelist-logs'); }

    private function csvPath(string $name): string { return $this->outDir().'/'.$name.'.csv'; }
    private function logPath(string $name): string { return $this->logDir().'/'.md5($name).'.log'; }

    /** Only allow names that actually exist as a PDF in the price-list folder. */
    private function resolvePdf(string $name): ?string
    {
        $path = $this->pdfDir().'/'.basename($name).'.pdf';

        return is_file($path) ? $path : null;
    }

    public function index()
    {
        $files = [];
        if (is_dir($this->pdfDir())) {
            foreach (glob($this->pdfDir().'/*.pdf') as $pdf) {
                $name = pathinfo($pdf, PATHINFO_FILENAME);
                $files[] = [
                    'name' => $name,
                    'sizeMb' => round(filesize($pdf) / 1048576, 1),
                ] + $this->fileStatus($name);
            }
        }
        usort($files, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return Inertia::render('Admin/PriceLists/Index', [
            'files' => $files,
            'brands' => Brand::ordered()->get(['id', 'name']),
            'available' => is_dir($this->pdfDir()),
        ]);
    }

    /** Conversion state + progress for one PDF, read from its log + CSV. */
    private function fileStatus(string $name): array
    {
        $log = $this->logPath($name);
        $csv = $this->csvPath($name);
        $state = 'idle';
        $progress = null;
        $rows = null;

        if (is_file($log)) {
            $text = (string) file_get_contents($log);
            if (preg_match_all('#(\d+)/(\d+) pages, (\d+) rows#', $text, $m, PREG_SET_ORDER)) {
                $last = end($m);
                $progress = ['page' => (int) $last[1], 'total' => (int) $last[2], 'rows' => (int) $last[3]];
            }
            if (str_contains($text, 'done:')) {
                $state = 'done';
            } elseif (time() - filemtime($log) < 180) {
                $state = 'running';
            } else {
                $state = 'idle'; // stalled / old log
            }
        }

        if (is_file($csv)) {
            if ($state !== 'running') {
                $state = 'done';
            }
            $rows = max(0, $this->countLines($csv) - 1);
        }

        return ['state' => $state, 'progress' => $progress, 'rows' => $rows, 'hasCsv' => is_file($csv)];
    }

    private function countLines(string $path): int
    {
        $count = 0;
        $fh = fopen($path, 'r');
        if (! $fh) {
            return 0;
        }
        while (! feof($fh)) {
            $count += substr_count((string) fread($fh, 1 << 20), "\n");
        }
        fclose($fh);

        return $count;
    }

    /** Launch the OCR converter for one PDF as a detached background process. */
    public function convert(Request $request)
    {
        $name = basename((string) $request->input('name'));
        $pdf = $this->resolvePdf($name);
        if (! $pdf) {
            return back()->with('error', 'PDF not found in the price-list folder.');
        }

        @mkdir($this->logDir(), 0775, true);
        @mkdir($this->outDir(), 0775, true);

        $node = (new ExecutableFinder)->find('node', 'node');
        $cmd = sprintf(
            'cd %s && nohup %s convert.mjs %s > %s 2> %s < /dev/null &',
            escapeshellarg($this->toolDir()),
            escapeshellarg($node),
            escapeshellarg($pdf),
            escapeshellarg($this->csvPath($name)),
            escapeshellarg($this->logPath($name)),
        );
        // Truncate the old log so progress detection starts fresh.
        file_put_contents($this->logPath($name), '');
        exec('bash -c '.escapeshellarg($cmd));

        return back()->with('success', "Converting “{$name}”. This runs in the background — progress updates below.");
    }

    /** Poll endpoint for the page to track progress without a full reload. */
    public function status(Request $request)
    {
        $names = array_filter(array_map('basename', (array) $request->input('names', [])));
        $out = [];
        foreach ($names as $name) {
            $out[$name] = $this->fileStatus($name);
        }

        return response()->json($out);
    }

    /** Import a generated CSV straight from disk into products. */
    public function import(Request $request, ProductController $products)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'brand_id' => 'nullable|integer|exists:brands,id',
        ]);
        $name = basename($data['name']);
        $csv = $this->csvPath($name);
        if (! is_file($csv)) {
            return back()->with('error', 'No CSV yet — convert this price list first.');
        }

        $rows = $this->readCsv($csv);
        if (! $rows) {
            return back()->with('error', 'That CSV looks empty.');
        }

        [$created, $updated, $skipped] = $products->upsertRows($rows, $data['brand_id'] ?? null);
        $msg = "Imported “{$name}”: {$created} added, {$updated} updated";
        if ($skipped) {
            $msg .= ", {$skipped} skipped";
        }

        return back()->with('success', $msg.'.');
    }

    /** Parse the converter's CSV into importer rows, mapping by header name. */
    private function readCsv(string $path): array
    {
        $fh = fopen($path, 'r');
        if (! $fh) {
            return [];
        }
        $header = fgetcsv($fh);
        if (! $header) {
            fclose($fh);

            return [];
        }
        $norm = fn ($h) => preg_replace('/[^a-z0-9]/', '', strtolower((string) $h));
        $idx = [];
        foreach ($header as $i => $h) {
            $idx[$norm($h)] = $i;
        }
        $col = function (array $r, array $keys) use ($idx) {
            foreach ($keys as $k) {
                if (isset($idx[$k]) && isset($r[$idx[$k]])) {
                    return $r[$idx[$k]];
                }
            }

            return null;
        };

        $rows = [];
        while (($r = fgetcsv($fh)) !== false) {
            $rows[] = [
                'item_no' => $col($r, ['itemno', 'item', 'sku', 'code', 'catno']),
                'name' => $col($r, ['name', 'description', 'product']),
                'spec' => $col($r, ['spec', 'rating']),
                'mrp' => $col($r, ['mrp', 'listprice', 'price']),
                'category' => $col($r, ['category', 'series', 'group']),
                'image' => $col($r, ['image', 'photo', 'img']),
            ];
        }
        fclose($fh);

        return $rows;
    }
}
