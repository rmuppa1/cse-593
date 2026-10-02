// Manages transient in-memory list of records, strictly enforcing the 7-day FIFO sliding window.
import '../models/daily_record.dart';

class FinanceRepository {
  // In-memory storage only — no database, no shared_preferences, no files
  final List<DailyRecord> _records = [];

  List<DailyRecord> getRecent7Days() {
    return List.unmodifiable(_records);
  }

  void addRecord(DailyRecord record) {
    // Keep most recent 7 days only (sliding window)
    if (_records.length >= 7) {
      _records.removeAt(0);
    }
    _records.add(record);
  }

  void clear() {
    _records.clear();
  }
}
