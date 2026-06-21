import Foundation
import CoreGraphics
import Vision
import ImageIO
import UniformTypeIdentifiers

// Usage: swift ocr.swift <pdfPath> <pageNumber> <dpi>
let args = CommandLine.arguments
guard args.count >= 3 else { FileHandle.standardError.write("need pdf + page\n".data(using:.utf8)!); exit(1) }
let path = args[1]

guard let doc = CGPDFDocument(URL(fileURLWithPath: path) as CFURL) else {
    FileHandle.standardError.write("cannot open pdf\n".data(using:.utf8)!); exit(1)
}
// Cheap page-count mode: `ocrbin <pdf> count`
if args[2].lowercased() == "count" { print(doc.numberOfPages); exit(0) }

let pageNum = Int(args[2]) ?? 1
let dpi = CGFloat(Double(args.count > 3 ? args[3] : "300") ?? 300)
guard let page = doc.page(at: pageNum) else {
    FileHandle.standardError.write("cannot open page\n".data(using:.utf8)!); exit(1)
}

let mediaBox = page.getBoxRect(.mediaBox)
let scale = dpi / 72.0
let W = Int(mediaBox.width * scale)
let H = Int(mediaBox.height * scale)
let cs = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                          space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { exit(1) }
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.scaleBy(x: scale, y: scale)
ctx.translateBy(x: -mediaBox.origin.x, y: -mediaBox.origin.y)
ctx.drawPDFPage(page)
guard let img = ctx.makeImage() else { exit(1) }

let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false   // codes like WX06N3P must not be "corrected"
req.minimumTextHeight = 0.0

let handler = VNImageRequestHandler(cgImage: img, options: [:])
try handler.perform([req])

var rows: [[String: Any]] = []
for obs in (req.results ?? []) {
    guard let cand = obs.topCandidates(1).first else { continue }
    let b = obs.boundingBox  // normalized, origin bottom-left
    let x = Double(b.minX) * Double(W)
    let y = Double(1 - b.maxY) * Double(H)   // top-left origin
    let w = Double(b.width) * Double(W)
    let h = Double(b.height) * Double(H)
    rows.append(["t": cand.string, "x": round(x), "y": round(y), "w": round(w), "h": round(h), "c": Double(cand.confidence)])
}
let out = ["page": pageNum, "w": W, "h": H, "items": rows] as [String: Any]
let data = try JSONSerialization.data(withJSONObject: out, options: [])
FileHandle.standardOutput.write(data)
