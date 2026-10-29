import 'package:flutter/material.dart';
import '../models/media.dart';
import '../services/tmdb_service.dart';
import '../widgets/movie_card.dart';
import '../theme/app_theme.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({Key? key}) : super(key: key);

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _controller = TextEditingController();
  List<Media> results = [];
  bool isSearching = false;

  void _onSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() => results = []);
      return;
    }

    setState(() => isSearching = true);
    final searchResults = await TMDBService.searchMulti(query);
    if (mounted) {
      setState(() {
        results = searchResults;
        isSearching = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          onSubmitted: _onSearch,
          textInputAction: TextInputAction.search,
          autofocus: false,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Search movies, tv series, anime...',
            hintStyle: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
            border: InputBorder.none,
            suffixIcon: _controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.white54, size: 18),
                    onPressed: () {
                      _controller.clear();
                      setState(() => results = []);
                    },
                  )
                : null,
          ),
        ),
      ),
      body: isSearching
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : results.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.search, size: 64, color: Colors.white24),
                      SizedBox(height: 12),
                      Text(
                        'Find your next favorite movie or show',
                        style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                      ),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 0.65,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: results.length,
                  itemBuilder: (context, index) {
                    return MovieCard(media: results[index], width: double.infinity);
                  },
                ),
    );
  }
}
