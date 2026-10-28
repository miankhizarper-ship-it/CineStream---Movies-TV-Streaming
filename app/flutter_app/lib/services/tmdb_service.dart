import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/media.dart';
import '../models/episode.dart';

class TMDBService {
  static const String baseUrl = 'https://api.themoviedb.org/3';
  static const String readAccessToken =
      'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2NGIxZWVmZmMzYTQ0YTJjODA5ZWZkMjJjOWYwMmUxMyIsIm5iZiI6MTc5MTg4MzIzMS4xLCJzdWIiOiI2YWNkZjdkZjRlYmIxODVkZGUxMzVkMDQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.txDvd-NUFtQK8gpJ8PS-GiNNz5rI_m_EUoF_kgRG2PU';

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': 'Bearer $readAccessToken',
      };

  // Trending All
  static Future<List<Media>> getTrending({String timeWindow = 'day'}) async {
    final url = Uri.parse('$baseUrl/trending/all/$timeWindow');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List results = data['results'] ?? [];
      return results.map((item) => Media.fromJson(item)).toList();
    }
    return [];
  }

  // Popular Movies
  static Future<List<Media>> getPopularMovies({int page = 1}) async {
    final url = Uri.parse('$baseUrl/movie/popular?page=$page');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List results = data['results'] ?? [];
      return results.map((item) => Media.fromJson(item, defaultType: 'movie')).toList();
    }
    return [];
  }

  // Top Rated TV Shows
  static Future<List<Media>> getTopRatedTV({int page = 1}) async {
    final url = Uri.parse('$baseUrl/tv/top_rated?page=$page');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List results = data['results'] ?? [];
      return results.map((item) => Media.fromJson(item, defaultType: 'tv')).toList();
    }
    return [];
  }

  // Anime series
  static Future<List<Media>> getAnime({int page = 1}) async {
    final url = Uri.parse(
        '$baseUrl/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=$page');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List results = data['results'] ?? [];
      return results.map((item) => Media.fromJson(item, defaultType: 'tv')).toList();
    }
    return [];
  }

  // Search Multi
  static Future<List<Media>> searchMulti(String query) async {
    if (query.trim().isEmpty) return [];
    final encodedQuery = Uri.encodeComponent(query.trim());
    final url = Uri.parse('$baseUrl/search/multi?query=$encodedQuery');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List results = data['results'] ?? [];
      return results
          .where((item) => item['media_type'] == 'movie' || item['media_type'] == 'tv')
          .map((item) => Media.fromJson(item))
          .toList();
    }
    return [];
  }

  // Get Media Details
  static Future<Map<String, dynamic>?> getDetails(int id, String mediaType) async {
    final url = Uri.parse('$baseUrl/$mediaType/$id?append_to_response=credits,similar');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return null;
  }

  // Get Season Episodes
  static Future<List<Episode>> getSeasonEpisodes(int tvId, int seasonNumber) async {
    final url = Uri.parse('$baseUrl/tv/$tvId/season/$seasonNumber');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List episodes = data['episodes'] ?? [];
      return episodes.map((e) => Episode.fromJson(e)).toList();
    }
    return [];
  }
}
