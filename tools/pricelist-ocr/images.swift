import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Usage: images.swift <pdf> <page> <dpi> <outDir>
// Renders the page, finds every drawn image (XObject) with its on-page rectangle,
// crops each from the render, saves PNG, prints JSON of rects.
let a = CommandLine.arguments
let path = a[1]; let pageNum = Int(a[2]) ?? 1; let dpi = CGFloat(Double(a.count>3 ? a[3]:"200") ?? 200)
let outDir = a.count>4 ? a[4] : "/tmp/gc-pptr/imgout"
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

guard let doc = CGPDFDocument(URL(fileURLWithPath: path) as CFURL), let page = doc.page(at: pageNum) else { exit(1) }
let mb = page.getBoxRect(.mediaBox)
let scale = dpi/72.0
let W = Int(mb.width*scale), H = Int(mb.height*scale)

// Render full page (for cropping)
let cs = CGColorSpaceCreateDeviceRGB()
let ctx = CGContext(data:nil,width:W,height:H,bitsPerComponent:8,bytesPerRow:0,space:cs,bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.setFillColor(CGColor(red:1,green:1,blue:1,alpha:1)); ctx.fill(CGRect(x:0,y:0,width:W,height:H))
ctx.scaleBy(x:scale,y:scale); ctx.translateBy(x:-mb.origin.x,y:-mb.origin.y); ctx.drawPDFPage(page)
let rendered = ctx.makeImage()!

// base: PDF point -> pixel (top-left origin)
let base = CGAffineTransform(a: scale, b: 0, c: 0, d: -scale, tx: -mb.minX*scale, ty: mb.maxY*scale)

final class State {
    var stack: [CGAffineTransform]
    var cur: CGAffineTransform
    var page: CGPDFPage
    var rects: [(CGRect,Int,Int)] = []   // pixelRect, imgW, imgH
    init(_ b: CGAffineTransform, _ p: CGPDFPage){ stack=[]; cur=b; page=p }
}
let st = State(base, page)
let info = Unmanaged.passUnretained(st).toOpaque()

func popNum(_ s: CGPDFScannerRef) -> CGFloat { var v: CGPDFReal = 0; return CGPDFScannerPopNumber(s,&v) ? CGFloat(v) : 0 }

let table = CGPDFOperatorTableCreate()!
CGPDFOperatorTableSetCallback(table, "q"){ s,i in let st = Unmanaged<State>.fromOpaque(i!).takeUnretainedValue(); st.stack.append(st.cur) }
CGPDFOperatorTableSetCallback(table, "Q"){ s,i in let st = Unmanaged<State>.fromOpaque(i!).takeUnretainedValue(); if let t = st.stack.popLast(){ st.cur = t } }
CGPDFOperatorTableSetCallback(table, "cm"){ s,i in
    let st = Unmanaged<State>.fromOpaque(i!).takeUnretainedValue()
    let f = popNum(s), e = popNum(s), d = popNum(s), c = popNum(s), b = popNum(s), a = popNum(s)
    let m = CGAffineTransform(a:a,b:b,c:c,d:d,tx:e,ty:f)
    st.cur = m.concatenating(st.cur)
}
CGPDFOperatorTableSetCallback(table, "Do"){ s,i in
    let st = Unmanaged<State>.fromOpaque(i!).takeUnretainedValue()
    var namePtr: UnsafePointer<Int8>? = nil
    guard CGPDFScannerPopName(s,&namePtr), let np = namePtr else { return }
    let name = String(cString: np)
    guard let res = st.page.dictionary else { return }
    var resDict: CGPDFDictionaryRef? = nil
    guard CGPDFDictionaryGetDictionary(res, "Resources", &resDict), let rd = resDict else { return }
    var xo: CGPDFDictionaryRef? = nil
    guard CGPDFDictionaryGetDictionary(rd, "XObject", &xo), let xod = xo else { return }
    var stream: CGPDFStreamRef? = nil
    guard CGPDFDictionaryGetStream(xod, name, &stream), let strm = stream else { return }
    guard let sd = CGPDFStreamGetDictionary(strm) else { return }
    var sub: UnsafePointer<Int8>? = nil
    CGPDFDictionaryGetName(sd, "Subtype", &sub)
    let subtype = sub != nil ? String(cString: sub!) : ""
    if subtype != "Image" { return }
    var iw: CGPDFInteger = 0, ih: CGPDFInteger = 0
    CGPDFDictionaryGetInteger(sd, "Width", &iw); CGPDFDictionaryGetInteger(sd, "Height", &ih)
    // unit square corners -> pixels
    let pts = [CGPoint(x:0,y:0),CGPoint(x:1,y:0),CGPoint(x:1,y:1),CGPoint(x:0,y:1)].map{ $0.applying(st.cur) }
    let xs = pts.map{$0.x}, ys = pts.map{$0.y}
    let r = CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()!-xs.min()!, height: ys.max()!-ys.min()!)
    st.rects.append((r, Int(iw), Int(ih)))
}

let stream = CGPDFContentStreamCreateWithPage(page)
let scanner = CGPDFScannerCreate(stream, table, info)
CGPDFScannerScan(scanner)
CGPDFScannerRelease(scanner)
CGPDFContentStreamRelease(stream)

var out: [[String:Any]] = []
var idx = 0
for (r,iw,ih) in st.rects {
    // clamp to page
    let cr = r.intersection(CGRect(x:0,y:0,width:W,height:H))
    if cr.width < 8 || cr.height < 8 { continue }
    idx += 1
    var saved = ""
    if let crop = rendered.cropping(to: cr) {
        let f = "\(outDir)/p\(pageNum)_img\(idx).png"
        if let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath:f) as CFURL, UTType.png.identifier as CFString, 1, nil) {
            CGImageDestinationAddImage(dst, crop, nil); CGImageDestinationFinalize(dst); saved = f
        }
    }
    out.append(["x":Int(cr.minX),"y":Int(cr.minY),"w":Int(cr.width),"h":Int(cr.height),"imgW":iw,"imgH":ih,"file":saved])
}
let payload: [String:Any] = ["page":pageNum,"W":W,"H":H,"count":out.count,"images":out]
FileHandle.standardOutput.write(try! JSONSerialization.data(withJSONObject: payload))
