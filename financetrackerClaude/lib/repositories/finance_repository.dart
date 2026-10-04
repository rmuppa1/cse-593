import '../models/daily_record.dart';

/// Transient in-memory store. Keeps only the 7 most recent days (FIFO window).
/// Nothing is persisted; data is lost when the app closes.
class FinanceRepository {
  static const int maxDays = 7;

  final List<DailyRecord> _records = [];

  /// Records sorted oldest to newest.
  List<DailyRecord> get records => List.unmodifiable(_records);

  /// Adds a record. An entry for an existing date replaces it. When more than
  /// 7 days are held, the oldest are dropped.
  void add(DailyRecord record) {
    _records.removeWhere((r) => r.date == record.date);
    _records.add(record);
    _records.sort((a, b) => a.date.compareTo(b.date));
    while (_records.length > maxDays) {
      _records.removeAt(0);
    }
  }

  DailyRecord? forDate(DateTime date) {
    final d = DateTime(date.year, date.month, date.day);
    for (final r in _records) {
      if (r.date == d) return r;
    }
    return null;
  }
}
