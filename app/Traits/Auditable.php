<?php

namespace App\Traits;

use App\Models\AuditLog;

trait Auditable
{
    protected function audit(string $action, $model, ?array $changes = null): void
    {
        AuditLog::create([
            'user_id'    => auth()->id(),
            'action'     => $action,
            'model_type' => class_basename($model),
            'model_id'   => $model->id ?? null,
            'changes'    => $changes,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }
}
