import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_theme.dart';

class PlayerScreen extends StatefulWidget {
  final int id;
  final String mediaType;
  final String title;
  final int season;
  final int episode;

  const PlayerScreen({
    Key? key,
    required this.id,
    required this.mediaType,
    required this.title,
    this.season = 1,
    this.episode = 1,
  }) : super(key: key);

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final WebViewController _controller;
  bool isLoading = true;
  String currentServer = 'default';
  bool isDimMode = false;

  late int currentSeason;
  late int currentEpisode;

  final List<Map<String, String>> servers = [
    {'id': 'default', 'name': 'FMOV Primary', 'badge': 'Fastest'},
    {'id': 'vector', 'name': 'Vector HD', 'badge': '1080p'},
    {'id': 'core', 'name': 'Core Server', 'badge': 'Stable'},
    {'id': 'valence', 'name': 'Valence Multi', 'badge': 'Multi-Sub'},
    {'id': 'stream4k', 'name': '4K Ultra', 'badge': 'UHD'},
  ];

  @override
  void initState() {
    super.initState();
    currentSeason = widget.season;
    currentEpisode = widget.episode;
    _initializeWebView();
  }

  String get _streamUrl {
    final serverParam = currentServer != 'default' ? '&server=$currentServer' : '';
    if (widget.mediaType == 'tv') {
      return 'https://fmov.my/embed/series/${widget.id}/$currentSeason/$currentEpisode?color=e50914$serverParam';
    }
    return 'https://fmov.my/embed/movie/${widget.id}?color=e50914$serverParam';
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => isLoading = true),
          onPageFinished: (_) => setState(() => isLoading = false),
          onWebResourceError: (error) {
            debugPrint('Web resource error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(_streamUrl));
  }

  void _switchServer(String serverId) {
    setState(() {
      currentServer = serverId;
    });
    _controller.loadRequest(Uri.parse(_streamUrl));
  }

  void _changeEpisode(int newEp) {
    setState(() {
      currentEpisode = newEp;
    });
    _controller.loadRequest(Uri.parse(_streamUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Minimalist Player Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              color: AppTheme.background,
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Expanded(
                    child: Text(
                      widget.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      isDimMode ? Icons.lightbulb : Icons.lightbulb_outline,
                      color: isDimMode ? Colors.amber : Colors.white70,
                      size: 20,
                    ),
                    onPressed: () {
                      setState(() => isDimMode = !isDimMode);
                    },
                    tooltip: 'Theater Dim Mode',
                  ),
                ],
              ),
            ),

            // Video Player Container
            Expanded(
              flex: isDimMode ? 8 : 4,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  WebViewWidget(controller: _controller),
                  if (isLoading)
                    Container(
                      color: Colors.black,
                      child: const Center(
                        child: CircularProgressIndicator(color: AppTheme.primary),
                      ),
                    ),
                ],
              ),
            ),

            // Controls & Server Options (Hidden if Dim Mode active)
            if (!isDimMode)
              Expanded(
                flex: 5,
                child: Container(
                  color: AppTheme.background,
                  padding: const EdgeInsets.all(16),
                  child: ListView(
                    children: [
                      // TV Episode Navigation Row
                      if (widget.mediaType == 'tv') ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            OutlinedButton.icon(
                              onPressed: currentEpisode > 1 ? () => _changeEpisode(currentEpisode - 1) : null,
                              icon: const Icon(Icons.chevron_left, size: 18),
                              label: const Text('Prev Ep'),
                              style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
                            ),
                            Text(
                              'Season $currentSeason • Ep $currentEpisode',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            ElevatedButton.icon(
                              onPressed: () => _changeEpisode(currentEpisode + 1),
                              icon: const Icon(Icons.chevron_right, size: 18),
                              label: const Text('Next Ep'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Server Selector
                      const Text(
                        'Select Stream Server',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: servers.map((srv) {
                          final isSelected = currentServer == srv['id'];
                          return InkWell(
                            onTap: () => _switchServer(srv['id']!),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? AppTheme.primary : AppTheme.card,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? AppTheme.primaryLight : AppTheme.border,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    srv['name']!,
                                    style: TextStyle(
                                      color: isSelected ? Colors.white : AppTheme.textSecondary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: Colors.black26,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      srv['badge']!,
                                      style: const TextStyle(fontSize: 9, color: Colors.white),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
