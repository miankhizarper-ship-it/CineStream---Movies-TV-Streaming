import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/media.dart';
import '../models/episode.dart';
import '../services/tmdb_service.dart';
import '../services/storage_service.dart';
import '../theme/app_theme.dart';
import 'player_screen.dart';

class DetailsScreen extends StatefulWidget {
  final int mediaId;
  final String mediaType;

  const DetailsScreen({
    Key? key,
    required this.mediaId,
    required this.mediaType,
  }) : super(key: key);

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> {
  Map<String, dynamic>? details;
  bool isLoading = true;
  bool isSaved = false;

  int currentSeason = 1;
  List<Episode> episodes = [];
  bool loadingEpisodes = false;

  @override
  void initState() {
    super.initState();
    _loadData();
    _checkBookmark();
  }

  Future<void> _checkBookmark() async {
    final saved = await StorageService.isBookmarked(widget.mediaId);
    if (mounted) {
      setState(() => isSaved = saved);
    }
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    final data = await TMDBService.getDetails(widget.mediaId, widget.mediaType);
    if (mounted) {
      setState(() {
        details = data;
        isLoading = false;
      });
    }

    if (widget.mediaType == 'tv') {
      _loadEpisodes(1);
    }
  }

  Future<void> _loadEpisodes(int seasonNum) async {
    setState(() {
      currentSeason = seasonNum;
      loadingEpisodes = true;
    });

    final eps = await TMDBService.getSeasonEpisodes(widget.mediaId, seasonNum);
    if (mounted) {
      setState(() {
        episodes = eps;
        loadingEpisodes = false;
      });
    }
  }

  void _toggleSave() async {
    if (details == null) return;
    final media = Media.fromJson(details!, defaultType: widget.mediaType);
    await StorageService.toggleBookmark(media);
    _checkBookmark();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isSaved ? 'Removed from Watchlist' : 'Added to Watchlist',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppTheme.card,
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
      );
    }

    if (details == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(
          child: Text('Failed to load title details'),
        ),
      );
    }

    final title = details!['title'] ?? details!['name'] ?? 'Untitled';
    final overview = details!['overview'] ?? '';
    final backdropPath = details!['backdrop_path'];
    final backdropUrl = backdropPath != null
        ? 'https://image.tmdb.org/t/p/w1280$backdropPath'
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800';

    final vote = (details!['vote_average'] as num?)?.toDouble() ?? 0.0;
    final year = (details!['release_date'] ?? details!['first_air_date'] ?? '2026').toString().split('-').first;
    final numberOfSeasons = details!['number_of_seasons'] ?? 1;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: backdropUrl,
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.3),
                          Colors.black.withOpacity(0.5),
                          AppTheme.background,
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 24,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.8),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.white24),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.star, color: Colors.amber, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    vote.toStringAsFixed(1),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.primary),
                              ),
                              child: Text(
                                widget.mediaType.toUpperCase(),
                                style: const TextStyle(
                                  color: AppTheme.primaryLight,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              year,
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Action Buttons
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PlayerScreen(
                              id: widget.mediaId,
                              mediaType: widget.mediaType,
                              title: title,
                              season: widget.mediaType == 'tv' ? currentSeason : 1,
                              episode: 1,
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 28),
                      label: const Text(
                        'Watch Now',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  IconButton(
                    onPressed: _toggleSave,
                    icon: Icon(
                      isSaved ? Icons.bookmark : Icons.bookmark_border,
                      color: isSaved ? AppTheme.primary : Colors.white,
                    ),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.card,
                      padding: const EdgeInsets.all(14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: AppTheme.border),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Overview Text
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Overview',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    overview,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // If TV Show, Season Selector and Episode List
          if (widget.mediaType == 'tv') ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Seasons & Episodes',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: List.generate(numberOfSeasons, (index) {
                          final seasonNum = index + 1;
                          final active = seasonNum == currentSeason;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text('Season $seasonNum'),
                              selected: active,
                              selectedColor: AppTheme.primary,
                              backgroundColor: AppTheme.card,
                              labelStyle: TextStyle(
                                color: active ? Colors.white : AppTheme.textSecondary,
                                fontWeight: FontWeight.bold,
                              ),
                              onSelected: (_) => _loadEpisodes(seasonNum),
                            ),
                          );
                        }),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (loadingEpisodes)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final ep = episodes[index];
                    return ListTile(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PlayerScreen(
                              id: widget.mediaId,
                              mediaType: 'tv',
                              title: '$title - S$currentSeason E${ep.episodeNumber}',
                              season: currentSeason,
                              episode: ep.episodeNumber,
                            ),
                          ),
                        );
                      },
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: ep.stillUrl,
                          width: 80,
                          height: 50,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => Container(
                            width: 80,
                            height: 50,
                            color: AppTheme.card,
                            child: const Icon(Icons.play_circle, color: Colors.white24),
                          ),
                        ),
                      ),
                      title: Text(
                        'EP ${ep.episodeNumber}: ${ep.name}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      subtitle: Text(
                        ep.durationString,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                      ),
                      trailing: const Icon(Icons.play_arrow_rounded, color: AppTheme.primary),
                    );
                  },
                  childCount: episodes.length,
                ),
              ),
          ],

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }
}
