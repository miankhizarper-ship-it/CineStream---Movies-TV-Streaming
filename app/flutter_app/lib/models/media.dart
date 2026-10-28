class Media {
  final int id;
  final String title;
  final String overview;
  final String? posterPath;
  final String? backdropPath;
  final String mediaType; // 'movie' or 'tv'
  final double voteAverage;
  final String releaseDate;

  Media({
    required this.id,
    required this.title,
    required this.overview,
    this.posterPath,
    this.backdropPath,
    required this.mediaType,
    required this.voteAverage,
    required this.releaseDate,
  });

  factory Media.fromJson(Map<String, dynamic> json, {String? defaultType}) {
    final type = json['media_type'] ?? defaultType ?? (json['first_air_date'] != null ? 'tv' : 'movie');
    final rawTitle = json['title'] ?? json['name'] ?? json['original_title'] ?? json['original_name'] ?? 'Untitled';
    final date = json['release_date'] ?? json['first_air_date'] ?? '';
    final vote = (json['vote_average'] as num?)?.toDouble() ?? 0.0;

    return Media(
      id: json['id'] ?? 0,
      title: rawTitle,
      overview: json['overview'] ?? '',
      posterPath: json['poster_path'],
      backdropPath: json['backdrop_path'],
      mediaType: type,
      voteAverage: vote,
      releaseDate: date,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'overview': overview,
      'poster_path': posterPath,
      'backdrop_path': backdropPath,
      'media_type': mediaType,
      'vote_average': voteAverage,
      'release_date': releaseDate,
    };
  }

  String get posterUrl {
    if (posterPath == null || posterPath!.isEmpty) {
      return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
    }
    return 'https://image.tmdb.org/t/p/w500$posterPath';
  }

  String get backdropUrl {
    if (backdropPath == null || backdropPath!.isEmpty) {
      return posterUrl;
    }
    return 'https://image.tmdb.org/t/p/w1280$backdropPath';
  }

  String get year {
    if (releaseDate.length >= 4) {
      return releaseDate.substring(0, 4);
    }
    return '2026';
  }
}
