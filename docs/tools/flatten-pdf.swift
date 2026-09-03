import Foundation
import Quartz

// flatten <in.pdf> <out.pdf> — rasterless flatten: redraws each page via PDFKit,
// which paints annotations (e.g. Preview signatures) into the page content stream
// so CGContext-based merges (merge-pdf.swift) don't drop them.
let args = CommandLine.arguments
guard args.count == 3 else { fputs("usage: flatten in.pdf out.pdf\n", stderr); exit(2) }

guard let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    fputs("cannot open \(args[1])\n", stderr); exit(1)
}
let outURL = URL(fileURLWithPath: args[2]) as CFURL
guard let ctx = CGContext(outURL, mediaBox: nil, nil) else {
    fputs("cannot create output context\n", stderr); exit(1)
}

for i in 0..<doc.pageCount {
    guard let page = doc.page(at: i) else { continue }
    var box = page.bounds(for: .mediaBox)
    ctx.beginPage(mediaBox: &box)
    ctx.saveGState()
    page.draw(with: .mediaBox, to: ctx)   // PDFKit draws content + annotations
    ctx.restoreGState()
    ctx.endPage()
}
ctx.closePDF()
print("flattened \(doc.pageCount) pages -> \(args[2])")
