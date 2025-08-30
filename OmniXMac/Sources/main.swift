import SwiftUI
import AppKit
import WebKit

@main
struct OmniXMacApp: App {    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    // Ativar app quando aparecer
                    NSApp.setActivationPolicy(.regular)
                    NSApp.activate(ignoringOtherApps: true)
                    
                    // Configurar janela para responsividade
                    if let window = NSApp.windows.first {
                        window.minSize = NSSize(width: 800, height: 600)
                        window.maxSize = NSSize(width: 4000, height: 3000)
                        window.collectionBehavior = [.fullScreenPrimary]
                    }
                }
        }
        .windowResizability(.contentMinSize)
        .windowToolbarStyle(.unified)
        .commands {
            CommandGroup(replacing: .newItem) {
                // Remove "New" menu
            }
            
            // Adicionar comando de tela cheia
            CommandGroup(after: .windowArrangement) {
                Button("Entrar em Tela Cheia") {
                    if let window = NSApp.keyWindow {
                        window.toggleFullScreen(nil)
                    }
                }
                .keyboardShortcut("f", modifiers: [.command, .control])
            }
        }
    }
}

struct ContentView: View {
    @State private var selectedOption: LaunchOption = .choose
    
    enum LaunchOption {
        case choose, local, web, dev
    }
    
    var body: some View {
        VStack(spacing: 0) {
            switch selectedOption {
            case .choose:
                OptionSelectionView { option in
                    selectedOption = option
                }
            case .local:
                LocalView { selectedOption = .choose }
            case .web:
                WebViewContainer { selectedOption = .choose }
            case .dev:
                DeveloperView { selectedOption = .choose }
            }
        }
        .frame(minWidth: 800, minHeight: 600)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct OptionSelectionView: View {
    let onSelect: (ContentView.LaunchOption) -> Void
    
    var body: some View {
        VStack(spacing: 40) {
            // Header
            VStack(spacing: 16) {
                Image(systemName: "message.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                
                Text("OmniX para Mac")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Plataforma WhatsApp Business")
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
            
            // Options
            VStack(spacing: 16) {
                Button(action: { onSelect(.local) }) {
                    OptionCard(
                        icon: "desktopcomputer",
                        title: "Executar Localmente",
                        subtitle: "Iniciar servidores Node.js local",
                        color: .green
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: { onSelect(.web) }) {
                    OptionCard(
                        icon: "globe", 
                        title: "Acessar Online",
                        subtitle: "Conectar ao omnix.odois.dev", 
                        color: .blue
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: { onSelect(.dev) }) {
                    OptionCard(
                        icon: "hammer.fill",
                        title: "Modo Desenvolvedor",
                        subtitle: "Debug, logs, APIs e ferramentas dev",
                        color: .orange
                    )
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal)
            .frame(maxWidth: 600)
            
            Spacer()
            
            // Footer
            Text("© 2024 OmniX - Versão 1.0")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            LinearGradient(
                colors: [.blue.opacity(0.1), .clear],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
}

struct LocalView: View {
    let onBack: () -> Void
    @State private var isConnected = false
    @State private var showingWebView = false
    @State private var isCheckingServers = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: onBack) {
                    HStack {
                        Image(systemName: "chevron.left")
                        Text("Voltar")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                Spacer()
                
                VStack {
                    Text("OmniX Local")
                        .font(.headline)
                    Text(isConnected ? "🟢 Conectado" : "🔴 Desconectado")
                        .font(.caption)
                        .foregroundColor(isConnected ? .green : .red)
                }
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            if showingWebView && isConnected {
                // WebView do localhost
                LocalWebView()
            } else {
                // Connection status and controls
                VStack(spacing: 30) {
                    Spacer()
                    
                    // Status Icon
                    Image(systemName: isConnected ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(isConnected ? .green : .red)
                    
                    VStack(spacing: 12) {
                        Text(isConnected ? "Conectado ao OmniX Local" : "Servidores Offline")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text(isConnected ? 
                            "Servidores rodando em localhost:8300 e localhost:8505" : 
                            "Verifique se os servidores estão rodando")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    
                    // Action buttons
                    VStack(spacing: 16) {
                        if isConnected {
                            Button("🚀 Abrir OmniX Local") {
                                showingWebView = true
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            
                            Button("Abrir no Safari") {
                                openInSafari()
                            }
                            .buttonStyle(.bordered)
                        } else {
                            Button(isCheckingServers ? "Verificando..." : "🔄 Verificar Conexão") {
                                checkLocalServers()
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            .disabled(isCheckingServers)
                            
                            Button("💡 Como Iniciar Servidores") {
                                showHowToStart()
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                    
                    Spacer()
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .onAppear {
            checkLocalServers()
        }
    }
    
    func checkLocalServers() {
        isCheckingServers = true
        
        // Verificar backend
        let task = URLSession.shared.dataTask(with: URL(string: "http://localhost:8300/health")!) { data, response, error in
            DispatchQueue.main.async {
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    isConnected = true
                } else {
                    isConnected = false
                }
                isCheckingServers = false
            }
        }
        task.resume()
    }
    
    func openInSafari() {
        if let url = URL(string: "http://localhost:8505") {
            NSWorkspace.shared.open(url)
        }
    }
    
    func showHowToStart() {
        let alert = NSAlert()
        alert.messageText = "Como Iniciar os Servidores"
        alert.informativeText = """
        Para usar o OmniX local, você precisa iniciar os servidores:
        
        1. Abra o Terminal
        2. Execute os comandos:
           cd /Users/ahspimentel/omnix/backend && npm run dev
           cd /Users/ahspimentel/omnix/frontend && npm run dev
        
        3. Volte aqui e clique "Verificar Conexão"
        
        Ou use o Modo Desenvolvedor para automação!
        """
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Abrir Modo Dev")
        
        let response = alert.runModal()
        if response == .alertSecondButtonReturn {
            // Voltar para tela principal em modo dev
            // (isso seria implementado passando um callback)
        }
    }
}

struct LocalWebView: View {
    var body: some View {
        VStack(spacing: 0) {
            // Navigation bar
            HStack {
                Image(systemName: "house.fill")
                    .foregroundColor(.blue)
                Text("OmniX Local")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("🔄") {
                    // Reload webview
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                
                Button("⛶") {
                    Task { @MainActor in
                        toggleFullScreen()
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .help("Tela Cheia (Ctrl+Cmd+F)")
                
                Button("Safari") {
                    NSWorkspace.shared.open(URL(string: "http://localhost:8505")!)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // WebView
            LocalOmniXWebView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct LocalOmniXWebView: NSViewRepresentable {
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        
        // Configurações para melhor experiência
        webView.allowsBackForwardNavigationGestures = true
        webView.setValue(true, forKey: "drawsBackground")
        
        // Carregar localhost
        if let url = URL(string: "http://localhost:8505") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        // Updates if needed
    }
}

struct WebViewContainer: View {
    let onBack: () -> Void
    @State private var isLoading = true
    @State private var currentUrl = "https://omnix.odois.dev"
    
    var body: some View {
        VStack(spacing: 0) {
            // Header com navegação
            HStack {
                Button(action: onBack) {
                    HStack {
                        Image(systemName: "chevron.left")
                        Text("Voltar")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                // URL bar
                HStack {
                    Image(systemName: "globe")
                        .foregroundColor(.blue)
                    
                    Text("omnix.odois.dev")
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(.secondary)
                    
                    if isLoading {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(NSColor.controlBackgroundColor))
                .cornerRadius(8)
                
                Spacer()
                
                HStack(spacing: 8) {
                    Button("🔄") {
                        // Reload - implementar
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    
                    Button("⛶") {
                        Task { @MainActor in
                            toggleFullScreen()
                        }
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .help("Tela Cheia (Ctrl+Cmd+F)")
                    
                    Button("Safari") {
                        NSWorkspace.shared.open(URL(string: "https://omnix.odois.dev")!)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // WebView principal
            ZStack {
                OmniXOnlineWebView(isLoading: $isLoading)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Loading overlay
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .controlSize(.large)
                        
                        VStack(spacing: 8) {
                            Text("Conectando ao OmniX")
                                .font(.title3)
                                .fontWeight(.semibold)
                            
                            Text("omnix.odois.dev")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(40)
                    .background(.regularMaterial)
                    .cornerRadius(16)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct OmniXOnlineWebView: NSViewRepresentable {
    @Binding var isLoading: Bool
    
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        
        // Carregar OmniX online
        if let url = URL(string: "https://omnix.odois.dev") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        // Updates if needed
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        let parent: OmniXOnlineWebView
        
        init(_ parent: OmniXOnlineWebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
            }
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }
    }
}

struct MacWebView: NSViewRepresentable {
    let url: String
    
    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView()
        
        if let url = URL(string: url) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        // Atualizar se necessário
    }
}

struct OptionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(color)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(color)
        }
        .padding(20)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
        .shadow(radius: 2)
    }
}

struct DeveloperView: View {
    let onBack: () -> Void
    @State private var selectedTab = "logs"
    @State private var logs: [String] = []
    @State private var apiResponse = ""
    @State private var isTestingAPI = false
    @State private var testUrl = "http://localhost:8300/health"
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: onBack) {
                    HStack {
                        Image(systemName: "chevron.left")
                        Text("Voltar")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                Spacer()
                
                HStack {
                    Image(systemName: "hammer.fill")
                        .foregroundColor(.orange)
                    Text("Modo Desenvolvedor")
                        .font(.headline)
                }
                
                Spacer()
                
                Button("Open Project") {
                    openInXcode()
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            // Tab Bar
            HStack(spacing: 0) {
                DevTabButton(title: "🛠️ Sistema", id: "logs", selected: $selectedTab)
                DevTabButton(title: "🌐 APIs", id: "api", selected: $selectedTab)
                DevTabButton(title: "📱 Frontend", id: "frontend", selected: $selectedTab)
                DevTabButton(title: "⚙️ Backend", id: "backend", selected: $selectedTab)
                
                Spacer()
                
                Button("⛶") {
                    Task { @MainActor in
                        toggleFullScreen()
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .help("Tela Cheia")
                .padding(.trailing)
            }
            .padding(.vertical, 8)
            .background(Color(NSColor.controlBackgroundColor))
            
            // Content based on selected tab
            Group {
                if selectedTab == "logs" {
                    SystemLogsView(logs: $logs)
                } else if selectedTab == "api" {
                    APITestView(
                        testUrl: $testUrl,
                        apiResponse: $apiResponse,
                        isTestingAPI: $isTestingAPI
                    )
                } else if selectedTab == "frontend" {
                    FrontendDevView()
                } else if selectedTab == "backend" {
                    BackendDevView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            startSystemMonitoring()
        }
    }
    
    func openInXcode() {
        let projectPath = "/Users/ahspimentel/omnix"
        NSWorkspace.shared.open(URL(fileURLWithPath: projectPath))
        addSystemLog("📱 Abrindo projeto no Finder...")
    }
    
    func startSystemMonitoring() {
        addSystemLog("🔧 Modo desenvolvedor iniciado")
        addSystemLog("📊 Monitorando sistema...")
        
        // Monitor inicial
        checkSystemStatus()
        
        // Monitor a cada 10 segundos
        Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { _ in
            Task { @MainActor in
                checkSystemStatus()
            }
        }
    }
    
    func checkSystemStatus() {
        // Verificar se backend está rodando
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        task.arguments = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:8300/health"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
            
            if output == "200" {
                addSystemLog("✅ Backend Online (3000)")
            } else {
                addSystemLog("❌ Backend Offline")
            }
        } catch {
            addSystemLog("🔍 Backend: Verificando...")
        }
    }
    
    func addSystemLog(_ message: String) {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        let logEntry = "[\(formatter.string(from: Date()))] \(message)"
        
        DispatchQueue.main.async {
            logs.append(logEntry)
            if logs.count > 100 {
                logs.removeFirst(20)
            }
        }
    }
}

struct DevTabButton: View {
    let title: String
    let id: String
    @Binding var selected: String
    
    var body: some View {
        Button(title) {
            selected = id
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(selected == id ? Color.blue : Color.clear)
        .foregroundColor(selected == id ? .white : .primary)
        .cornerRadius(8)
    }
}

struct SystemLogsView: View {
    @Binding var logs: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("🛠️ Logs do Sistema")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("Limpar") {
                    logs.removeAll()
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
            
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 2) {
                    ForEach(logs.indices, id: \.self) { index in
                        Text(logs[index])
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.secondary)
                            .textSelection(.enabled)
                    }
                }
                .padding(12)
            }
            .background(Color.black.opacity(0.05))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
        }
        .padding()
    }
}

struct APITestView: View {
    @Binding var testUrl: String
    @Binding var apiResponse: String
    @Binding var isTestingAPI: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("🌐 Testador de APIs")
                .font(.title2)
                .fontWeight(.semibold)
            
            HStack {
                TextField("URL da API", text: $testUrl)
                    .textFieldStyle(.roundedBorder)
                
                Button("Testar") {
                    testAPI()
                }
                .buttonStyle(.borderedProminent)
                .disabled(isTestingAPI)
            }
            
            // APIs rápidas
            VStack(alignment: .leading, spacing: 8) {
                Text("APIs Rápidas:")
                    .font(.headline)
                
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                    QuickAPIButton(title: "Health", url: "http://localhost:8300/health", testUrl: $testUrl)
                    QuickAPIButton(title: "Workflows", url: "http://localhost:8300/api/workflows", testUrl: $testUrl)
                    QuickAPIButton(title: "Templates", url: "http://localhost:8300/api/workflow-templates", testUrl: $testUrl)
                    QuickAPIButton(title: "Frontend", url: "http://localhost:8505", testUrl: $testUrl)
                }
            }
            
            // Response
            VStack(alignment: .leading, spacing: 8) {
                Text("Resposta:")
                    .font(.headline)
                
                ScrollView {
                    Text(apiResponse.isEmpty ? "Nenhuma resposta ainda..." : apiResponse)
                        .font(.system(.caption, design: .monospaced))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .textSelection(.enabled)
                }
                .background(Color.black.opacity(0.05))
                .cornerRadius(8)
                .frame(minHeight: 200)
            }
        }
        .padding()
    }
    
    func testAPI() {
        guard let url = URL(string: testUrl) else {
            apiResponse = "❌ URL inválida"
            return
        }
        
        isTestingAPI = true
        apiResponse = "🔄 Testando API..."
        
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            DispatchQueue.main.async {
                isTestingAPI = false
                
                if let error = error {
                    apiResponse = "❌ Erro: \(error.localizedDescription)"
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    var result = "📡 Status: \(httpResponse.statusCode)\n\n"
                    
                    if let data = data, let json = String(data: data, encoding: .utf8) {
                        result += "📄 Response:\n\(json)"
                    }
                    
                    apiResponse = result
                } else {
                    apiResponse = "❌ Resposta inválida"
                }
            }
        }
        
        task.resume()
    }
}

struct QuickAPIButton: View {
    let title: String
    let url: String
    @Binding var testUrl: String
    
    var body: some View {
        Button(title) {
            testUrl = url
        }
        .buttonStyle(.bordered)
        .controlSize(.small)
        .frame(maxWidth: .infinity)
    }
}

struct FrontendDevView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("📱 Frontend Development")
                .font(.title2)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                DevActionCard(
                    icon: "play.fill",
                    title: "Iniciar Frontend Dev",
                    subtitle: "npm run dev na porta 5175",
                    action: { startFrontend() }
                )
                
                DevActionCard(
                    icon: "arrow.clockwise", 
                    title: "Reinstalar Dependências",
                    subtitle: "npm install limpo",
                    action: { reinstallFrontend() }
                )
                
                DevActionCard(
                    icon: "safari",
                    title: "Abrir Frontend",
                    subtitle: "localhost:8505 no navegador", 
                    action: { openFrontend() }
                )
                
                DevActionCard(
                    icon: "folder",
                    title: "Abrir Pasta Frontend",
                    subtitle: "Finder/VS Code",
                    action: { openFrontendFolder() }
                )
            }
            
            Spacer()
        }
        .padding()
    }
    
    func startFrontend() {
        executeTerminalCommand("cd /Users/ahspimentel/omnix/frontend && npm run dev")
    }
    
    func reinstallFrontend() {
        executeTerminalCommand("cd /Users/ahspimentel/omnix/frontend && rm -rf node_modules && npm install")
    }
    
    func openFrontend() {
        NSWorkspace.shared.open(URL(string: "http://localhost:8505")!)
    }
    
    func openFrontendFolder() {
        NSWorkspace.shared.open(URL(fileURLWithPath: "/Users/ahspimentel/omnix/frontend"))
    }
}

struct BackendDevView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("⚙️ Backend Development")
                .font(.title2)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                DevActionCard(
                    icon: "play.fill",
                    title: "Iniciar Backend Dev",
                    subtitle: "npm run dev na porta 3000",
                    action: { startBackend() }
                )
                
                DevActionCard(
                    icon: "arrow.clockwise",
                    title: "Reinstalar Dependências",
                    subtitle: "npm install limpo", 
                    action: { reinstallBackend() }
                )
                
                DevActionCard(
                    icon: "network",
                    title: "Test Health Check",
                    subtitle: "Verificar se API responde",
                    action: { testBackendHealth() }
                )
                
                DevActionCard(
                    icon: "folder",
                    title: "Abrir Pasta Backend", 
                    subtitle: "Finder/VS Code",
                    action: { openBackendFolder() }
                )
            }
            
            Spacer()
        }
        .padding()
    }
    
    func startBackend() {
        executeTerminalCommand("cd /Users/ahspimentel/omnix/backend && npm run dev")
    }
    
    func reinstallBackend() {
        executeTerminalCommand("cd /Users/ahspimentel/omnix/backend && rm -rf node_modules && npm install")
    }
    
    func testBackendHealth() {
        NSWorkspace.shared.open(URL(string: "http://localhost:8300/health")!)
    }
    
    func openBackendFolder() {
        NSWorkspace.shared.open(URL(fileURLWithPath: "/Users/ahspimentel/omnix/backend"))
    }
}

struct DevActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.orange)
                    .frame(width: 30)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding(16)
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.orange.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

func executeTerminalCommand(_ command: String) {
    // Abrir Terminal e executar comando
    let script = """
    tell application "Terminal"
        activate
        do script "\(command)"
    end tell
    """
    
    let appleScript = NSAppleScript(source: script)
    appleScript?.executeAndReturnError(nil)
}

@MainActor
func toggleFullScreen() {
    if let window = NSApp.keyWindow {
        window.toggleFullScreen(nil)
    }
}
