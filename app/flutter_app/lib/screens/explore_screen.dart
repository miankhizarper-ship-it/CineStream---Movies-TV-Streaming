import 'package:flutter/material.dart';
import '../models/media.dart';
import '../services/tmdb_service.dart';
import '../widgets/movie_card.dart';
import '../theme/app_theme.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({Key? key}) : super(key: key);

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  String selectedType = 'movie'; // 'movie' or 'tv'
  List<Media> items = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategory();
  }

  Future<void> _loadCategory() async {
    setState(() => isLoading = true);
    final results = selectedType == 'movie'
        ? await TMDBService.getPopularMovies()
        : await TMDBService.getTopRatedTV();

    if (mounted) {
      setState(() {
        items = results;
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Explore Catalog',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: Column(
        children: [
          // Filter Switcher
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      if (selectedType != 'movie') {
                        setState(() => selectedType = 'movie');
                        _loadCategory();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: selectedType == 'movie' ? AppTheme.primary : AppTheme.card,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Movies', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      if (selectedType != 'tv') {
                        setState(() => selectedType = 'tv');
                        _loadCategory();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: selectedType == 'tv' ? AppTheme.primary : AppTheme.card,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('TV Series', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),

          // Grid View
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      childAspectRatio: 0.65,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                    ),
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      return MovieCard(media: items[index], width: double.infinity);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
