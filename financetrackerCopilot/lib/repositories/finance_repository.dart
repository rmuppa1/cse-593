import '../models/daily_record.dart';

class FinanceRepository {
  static const int maxDays = 7;

  final List<DailyRecord> _records = [];

  /// Records sorted oldest to newest.
  List<DailyRecord> get records => List.unmodifiable(_records);

  /// Adds or replaces the record for its date, keeping only the most recent 7 days.
  void save(DailyRecord record) {
    _records.removeWhere((r) => r.date == record.date);
    _records.add(record);
    _records.sort((a, b) => a.date.compareTo(b.date));
    while (_records.length > maxDays) {
      _records.removeAt(0);
    }
  }
}
