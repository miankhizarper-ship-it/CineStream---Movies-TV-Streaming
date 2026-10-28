import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/media.dart';

class StorageService {
  static const String _watchlistKey = 'cinestream_watchlist';
  static const String _historyKey = 'cinestream_history';

  // Watchlist Methods
  static Future<List<Media>> getWatchlist() async {
    final prefs = await SharedPreferences.getInstance();
    final String? raw = prefs.getString(_watchlistKey);
    if (raw == null) return [];

    final List decoded = json.decode(raw);
    return decoded.map((item) => Media.fromJson(item)).toList();
  }

  static Future<bool> isBookmarked(int id) async {
    final list = await getWatchlist();
    return list.any((item) => item.id == id);
  }

  static Future<void> toggleBookmark(Media media) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getWatchlist();
    final exists = list.any((item) => item.id == media.id);

    if (exists) {
      list.removeWhere((item) => item.id == media.id);
    } else {
      list.insert(0, media);
    }

    final raw = json.encode(list.map((item) => item.toJson()).toList());
    await prefs.setString(_watchlistKey, raw);
  }

  // History Methods
  static Future<List<Map<String, dynamic>>> getHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final String? raw = prefs.getString(_historyKey);
    if (raw == null) return [];

    final List decoded = json.decode(raw);
    return decoded.cast<Map<String, dynamic>>();
  }

  static Future<void> addToHistory({
    required Media media,
    int? season,
    int? episode,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final history = await getHistory();

    history.removeWhere((item) => item['id'] == media.id);

    history.insert(0, {
      'id': media.id,
      'title': media.title,
      'media_type': media.mediaType,
      'poster_path': media.posterPath,
      'backdrop_path': media.backdropPath,
      'season': season,
      'episode': episode,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });

    final raw = json.encode(history.take(20).toList());
    await prefs.setString(_historyKey, raw);
  }
}
