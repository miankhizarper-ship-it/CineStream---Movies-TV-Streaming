import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/media.dart';
import '../services/tmdb_service.dart';
import '../services/storage_service.dart';
import '../widgets/movie_card.dart';
import '../theme/app_theme.dart';
import 'details_screen.dart';
import 'player_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Media> trending = [];
  List<Media> popularMovies = [];
  List<Media> topRatedTV = [];
  List<Media> anime = [];
  List<Map<String, dynamic>> history = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => isLoading = true);
    final results = await Future.wait([
      TMDBService.getTrending(),
      TMDBService.getPopularMovies(),
      TMDBService.getTopRatedTV(),
      TMDBService.getAnime(),
      StorageService.getHistory(),
    ]);

    if (mounted) {
      setState(() {
        trending = results[0] as List<Media>;
        popularMovies = results[1] as List<Media>;
        topRatedTV = results[2] as List<Media>;
        anime = results[3] as List<Media>;
        history = results[4] as List<Map<String, dynamic>>;
        isLoading = false;
      });
    }
  }

  Widget _buildSection(String title, List<Media> items) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 3,
                height: 16,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 190,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            itemBuilder: (context, index) {
              return MovieCard(media: items[index]);
            },
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    final hero = trending.isNotEmpty ? trending.first : null;

    return RefreshIndicator(
      onRefresh: _loadAll,
      color: AppTheme.primary,
      backgroundColor: AppTheme.card,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Spotlight Hero Banner
          if (hero != null)
            Stack(
              children: [
                SizedBox(
                  height: 440,
                  width: double.infinity,
                  child: CachedNetworkImage(
                    imageUrl: hero.backdropUrl,
                    fit: BoxFit.cover,
                  ),
                ),
                Container(
                  height: 440,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.4),
                        Colors.transparent,
                        AppTheme.background.withOpacity(0.8),
                        AppTheme.background,
                      ],
                      stops: const [0.0, 0.4, 0.8, 1.0],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 24,
                  left: 16,
                  right: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.primary),
                        ),
                        child: const Text(
                          '#1 TRENDING TODAY',
                          style: TextStyle(
                            color: AppTheme.primaryLight,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        hero.title,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => PlayerScreen(
                                    id: hero.id,
                                    mediaType: hero.mediaType,
                                    title: hero.title,
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 22),
                            label: const Text(
                              'Play Now',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => DetailsScreen(
                                    mediaId: hero.id,
                                    mediaType: hero.mediaType,
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.info_outline, color: Colors.white, size: 18),
                            label: const Text(
                              'Details',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white.withOpacity(0.1),
                              side: BorderSide(color: Colors.white.withOpacity(0.2)),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

          // Horizontal Media Rows
          _buildSection('Trending Today', trending),
          _buildSection('Popular Movies', popularMovies),
          _buildSection('Top Rated TV Shows', topRatedTV),
          _buildSection('Anime & Animation', anime),

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
