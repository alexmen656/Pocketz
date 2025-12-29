//
//  ContentView.swift
//  Pocketz Watch Watch App
//
//  Created by Alex Polan on 11/30/25.
//

// Mostly AI generated tbh, I am not a SwiftUI expert :)
import SwiftUI
import WatchKit

struct StoredCard: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let logo: String
    let bgColor: String
    let textColor: String
    var barcode: String?
    var barcodeFormat: String?
    var cardNumber: String?
    var memberNumber: String?
    var isCustomCard: Bool?
    var deleted: Bool?
    var isPinned: Bool?
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: StoredCard, rhs: StoredCard) -> Bool {
        lhs.id == rhs.id
    }
    
    var backgroundColor: Color {
        Color(hex: bgColor) ?? .gray
    }
    
    var foregroundColor: Color {
        Color(hex: textColor) ?? .white
    }
    
    var barcodeType: BarcodeType {
        guard let format = barcodeFormat?.uppercased() else { return .code128 }
        switch format {
        case "QR_CODE", "QRCODE", "QR":
            return .qrCode
        case "EAN13", "EAN-13", "EAN_13":
            return .ean13
        case "GS1_DATABAR", "GS1-DATABAR", "DATABAR":
            return .databar
        default:
            return .code128
        }
    }
    
    var barcodeValue: String {
        barcode ?? cardNumber ?? memberNumber ?? ""
    }
    
    var initials: String {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        if trimmed.count <= 2 {
            return trimmed.uppercased()
        }
        let words = trimmed.split(separator: " ")
        if words.count == 1 {
            return String(trimmed.prefix(2)).uppercased()
        }
        return words.prefix(2).map { String($0.first ?? Character("")) }.joined().uppercased()
    }
}

enum BarcodeType {
    case code128
    case ean13
    case qrCode
    case databar
}

class CardStorageManager: ObservableObject {
    @Published var cards: [StoredCard] = []
    
    private let appGroupID = "group.com.pocketz.shared"
    private let cardsKey = "cards"
    
    init() {
        loadCards()
    }
    
    func loadCards() {
        guard let groupDefaults = UserDefaults(suiteName: appGroupID) else {
            print("❌ Unable to access App Group: \(appGroupID)")
            return
        }
        44
        if let cardsString = groupDefaults.string(forKey: cardsKey) {
            if let data = cardsString.data(using: .utf8) {
                do {
                    let decoded = try JSONDecoder().decode([StoredCard].self, from: data)
                    self.cards = decoded.filter { $0.deleted != true }
                    print("✅ Loaded \(self.cards.count) cards from shared storage")
                } catch {
                    print("❌ Failed to decode cards: \(error)")
                }
            }
        } else if let cardsData = groupDefaults.data(forKey: cardsKey) {
            do {
                let decoded = try JSONDecoder().decode([StoredCard].self, from: cardsData)
                self.cards = decoded.filter { $0.deleted != true }
                print("✅ Loaded \(self.cards.count) cards from shared storage (data)")
            } catch {
                print("❌ Failed to decode cards data: \(error)")
            }
        } else {
            print("⚠️ No cards found in shared storage")
        }
    }
}

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }
        
        let length = hexSanitized.count
        
        switch length {
        case 3:
            let r = Double((rgb >> 8) & 0xF) / 15.0
            let g = Double((rgb >> 4) & 0xF) / 15.0
            let b = Double(rgb & 0xF) / 15.0
            self.init(red: r, green: g, blue: b)
        case 6:
            let r = Double((rgb >> 16) & 0xFF) / 255.0
            let g = Double((rgb >> 8) & 0xFF) / 255.0
            let b = Double(rgb & 0xFF) / 255.0
            self.init(red: r, green: g, blue: b)
        case 8:
            let a = Double((rgb >> 24) & 0xFF) / 255.0
            let r = Double((rgb >> 16) & 0xFF) / 255.0
            let g = Double((rgb >> 8) & 0xFF) / 255.0
            let b = Double(rgb & 0xFF) / 255.0
            self.init(red: r, green: g, blue: b, opacity: a)
        default:
            return nil
        }
    }
}

struct ContentView: View {
    @StateObject private var storageManager = CardStorageManager()
    
    var body: some View {
        NavigationStack {
            Group {
                if storageManager.cards.isEmpty {
                    EmptyStateView()
                } else {
                    CardListView(cards: storageManager.cards)
                }
            }
            .navigationTitle("Karten")
            .onAppear {
                storageManager.loadCards()
            }
        }
    }
}

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "creditcard")
                .font(.system(size: 40))
                .foregroundColor(.secondary)
            
            Text("Keine Karten")
                .font(.headline)
            
            Text("Füge Karten in der iPhone App hinzu")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct CardListView: View {
    let cards: [StoredCard]
    
    var sortedCards: [StoredCard] {
        cards.sorted { ($0.isPinned ?? false) && !($1.isPinned ?? false) }
    }
    
    var body: some View {
        List(sortedCards) { card in
            NavigationLink(value: card) {
                CardRowView(card: card)
            }
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
        }
        .listStyle(.carousel)
        .navigationDestination(for: StoredCard.self) { card in
            CardDetailView(card: card)
        }
    }
}

struct CardRowView: View {
    let card: StoredCard
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(card.backgroundColor)
                    .frame(width: 44, height: 44)
                
                Text(card.initials)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(card.foregroundColor)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    if card.isPinned == true {
                        Image(systemName: "pin.fill")
                            .font(.system(size: 8))
                            .foregroundColor(.orange)
                    }
                    Text(card.name)
                        .font(.system(.body, design: .rounded, weight: .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                }
            }
        }
        .padding(.vertical, 6)
    }
}

struct CardDetailView: View {
    let card: StoredCard
    @State private var showFullscreen = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                CardHeaderView(card: card)
                
                if !card.barcodeValue.isEmpty {
                    BarcodeView(card: card)
                        .onTapGesture {
                            showFullscreen = true
                        }
                    
                    Text("Tippen für Vollbild")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                } else {
                    Text("Kein Barcode")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 4)
        }
        .navigationTitle(card.name)
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showFullscreen) {
            FullscreenBarcodeView(card: card, isPresented: $showFullscreen)
        }
    }
}

struct CardHeaderView: View {
    let card: StoredCard
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(card.backgroundColor)
            
            VStack(spacing: 4) {
                Text(card.initials)
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundColor(card.foregroundColor)
                
                Text(card.name)
                    .font(.system(.caption, design: .rounded, weight: .bold))
                    .foregroundColor(card.foregroundColor)
                    .lineLimit(1)
            }
        }
        .frame(height: 70)
    }
}

struct BarcodeView: View {
    let card: StoredCard
    
    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.white)
                
                switch card.barcodeType {
                case .qrCode:
                    QRCodeView(value: card.barcodeValue)
                        .padding(8)
                case .ean13, .code128, .databar:
                    BarcodePatternView(value: card.barcodeValue)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 10)
                }
            }
            .frame(height: card.barcodeType == .qrCode ? 80 : 55)
            
            Text(formatBarcodeNumber(card.barcodeValue))
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundColor(.secondary)
        }
    }
    
    func formatBarcodeNumber(_ value: String) -> String {
        var result = ""
        for (index, char) in value.enumerated() {
            if index > 0 && index % 4 == 0 {
                result += " "
            }
            result.append(char)
        }
        return result
    }
}

struct BarcodePatternView: View {
    let value: String
    
    var body: some View {
        GeometryReader { geometry in
            HStack(spacing: 0) {
                ForEach(generateBars(for: value, width: geometry.size.width), id: \.offset) { bar in
                    Rectangle()
                        .fill(bar.isBlack ? Color.black : Color.white)
                        .frame(width: bar.width)
                }
            }
        }
    }
    
    struct Bar: Identifiable {
        let offset: Int
        let isBlack: Bool
        let width: CGFloat
        
        var id: Int { offset }
    }
    
    func generateBars(for value: String, width: CGFloat) -> [Bar] {
        var bars: [Bar] = []
        let pattern = generatePattern(from: value)
        let totalUnits = pattern.reduce(0, +)
        let unitWidth = width / CGFloat(totalUnits)
        
        var offset = 0
        for (index, units) in pattern.enumerated() {
            bars.append(Bar(
                offset: offset,
                isBlack: index % 2 == 0,
                width: CGFloat(units) * unitWidth
            ))
            offset += 1
        }
        
        return bars
    }
    
    func generatePattern(from value: String) -> [Int] {
        var pattern: [Int] = [2, 1, 1]
        
        for char in value {
            let code = Int(char.asciiValue ?? 48) % 10
            pattern.append(1 + (code % 3))
            pattern.append(1 + ((code + 1) % 2))
            pattern.append(1 + ((code + 2) % 3))
            pattern.append(1 + (code % 2))
        }
        
        pattern.append(contentsOf: [1, 1, 2])
        return pattern
    }
}

struct QRCodeView: View {
    let value: String
    
    var body: some View {
        GeometryReader { geometry in
            let size = min(geometry.size.width, geometry.size.height)
            let moduleCount = 21
            let moduleSize = size / CGFloat(moduleCount)
            
            Canvas { context, _ in
                let pattern = generateQRPattern(from: value)
                
                for row in 0..<moduleCount {
                    for col in 0..<moduleCount {
                        if pattern[row][col] {
                            let rect = CGRect(
                                x: CGFloat(col) * moduleSize,
                                y: CGFloat(row) * moduleSize,
                                width: moduleSize + 0.5,
                                height: moduleSize + 0.5
                            )
                            context.fill(Path(rect), with: .color(.black))
                        }
                    }
                }
            }
            .frame(width: size, height: size)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
    
    func generateQRPattern(from value: String) -> [[Bool]] {
        let size = 21
        var pattern = Array(repeating: Array(repeating: false, count: size), count: size)
        
        addFinderPattern(&pattern, at: (0, 0))
        addFinderPattern(&pattern, at: (0, size - 7))
        addFinderPattern(&pattern, at: (size - 7, 0))
        
        for i in 8..<(size - 8) {
            pattern[6][i] = i % 2 == 0
            pattern[i][6] = i % 2 == 0
        }
        
        var hash = 0
        for char in value {
            hash = hash &* 31 &+ Int(char.asciiValue ?? 0)
        }
        
        for row in 0..<size {
            for col in 0..<size {
                if !isReserved(row: row, col: col, size: size) {
                    hash = hash &* 1103515245 &+ 12345
                    pattern[row][col] = (hash >> 16) % 3 != 0
                }
            }
        }
        
        return pattern
    }
    
    func addFinderPattern(_ pattern: inout [[Bool]], at pos: (Int, Int)) {
        let (startRow, startCol) = pos
        for r in 0..<7 {
            for c in 0..<7 {
                let row = startRow + r
                let col = startCol + c
                guard row < pattern.count && col < pattern[0].count else { continue }
                
                if r == 0 || r == 6 || c == 0 || c == 6 ||
                   (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                    pattern[row][col] = true
                }
            }
        }
    }
    
    func isReserved(row: Int, col: Int, size: Int) -> Bool {
        if (row < 8 && col < 8) || (row < 8 && col >= size - 8) || (row >= size - 8 && col < 8) {
            return true
        }

        if row == 6 || col == 6 {
            return true
        }
        return false
    }
}

struct FullscreenBarcodeView: View {
    let card: StoredCard
    @Binding var isPresented: Bool
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.white
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    HStack {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.gray.opacity(0.6))
                        Text(card.name)
                            .font(.system(.caption, design: .rounded, weight: .semibold))
                            .foregroundColor(.black.opacity(0.7))
                    }
                    .padding(.top, 8)
                    
                    Spacer()
                    
                    Group {
                        switch card.barcodeType {
                        case .qrCode:
                            QRCodeView(value: card.barcodeValue)
                                .frame(width: geometry.size.width - 20, height: geometry.size.width - 20)
                        case .ean13, .code128, .databar:
                            VStack(spacing: 8) {
                                BarcodePatternView(value: card.barcodeValue)
                                    .frame(height: 70)
                                    .padding(.horizontal, 8)
                                
                                Text(card.barcodeValue)
                                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                                    .foregroundColor(.black)
                            }
                        }
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 10)
            }
            .onTapGesture {
                isPresented = false
            }
        }
        .onAppear {
            WKInterfaceDevice.current().play(.click)
        }
        .onDisappear {
            WKInterfaceDevice.current().play(.click)
        }
    }
}

#Preview {
    ContentView()
}
