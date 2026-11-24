import 'dart:collection';

import '../models/daily_record.dart';

class FinanceRepository {
  static const int maximumRecords = 7;

  final List<DailyRecord> _records = [];

  UnmodifiableListView<DailyRecord> get records =>
      UnmodifiableListView(_records);

  void addOrReplace(DailyRecord record) {
    _records.removeWhere((item) => _sameDate(item.date, record.date));
    _records.add(record);
    _records.sort((a, b) => b.date.compareTo(a.date));
    if (_records.length > maximumRecords) {
      _records.removeRange(maximumRecords, _records.length);
    }
  }

  bool _sameDate(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}
