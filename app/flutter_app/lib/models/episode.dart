class Episode {
  final int id;
  final int episodeNumber;
  final int seasonNumber;
  final String name;
  final String overview;
  final String? stillPath;
  final int? runtime;

  Episode({
    required this.id,
    required this.episodeNumber,
    required this.seasonNumber,
    required this.name,
    required this.overview,
    this.stillPath,
    this.runtime,
  });

  factory Episode.fromJson(Map<String, dynamic> json) {
    return Episode(
      id: json['id'] ?? 0,
      episodeNumber: json['episode_number'] ?? 1,
      seasonNumber: json['season_number'] ?? 1,
      name: json['name'] ?? 'Episode ${json['episode_number'] ?? 1}',
      overview: json['overview'] ?? '',
      stillPath: json['still_path'],
      runtime: json['runtime'],
    );
  }

  String get stillUrl {
    if (stillPath == null || stillPath!.isEmpty) {
      return 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&q=80';
    }
    return 'https://image.tmdb.org/t/p/w500$stillPath';
  }

  String get durationString {
    if (runtime != null && runtime! > 0) {
      return '${runtime}m';
    }
    return '45m';
  }
}
