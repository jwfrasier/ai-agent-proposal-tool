// Usage: swift render-page.swift in.pdf pageIndex out.png [scale]
import Foundation
import PDFKit
import AppKit

let args = CommandLine.arguments
guard args.count >= 4, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])),
      let p = Int(args[2]), let page = doc.page(at: p) else { print("usage"); exit(1) }
let scale: CGFloat = args.count > 4 ? CGFloat(Double(args[4]) ?? 2.0) : 2.0
let bounds = page.bounds(for: .mediaBox)
let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
let img = page.thumbnail(of: size, for: .mediaBox)
guard let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else { exit(1) }
try! png.write(to: URL(fileURLWithPath: args[3]))
print("wrote \(args[3])")
