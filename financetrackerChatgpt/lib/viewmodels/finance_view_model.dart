import 'dart:collection';

import 'package:flutter/foundation.dart';

import '../models/daily_record.dart';
import '../models/expense_category.dart';
import '../models/financial_calculator.dart';
import '../repositories/finance_repository.dart';

class FinanceViewModel extends ChangeNotifier {
  FinanceViewModel(this._repository);

  final FinanceRepository _repository;

  UnmodifiableListView<DailyRecord> get records => _repository.records;
  FinancialSummary get summary => FinancialCalculator.summarize(records);

  void saveRecord({
    required DateTime date,
    required double income,
    required Map<ExpenseCategory, double> expensesByCategory,
    required double savings,
  }) {
    _repository.addOrReplace(
      DailyRecord(
        date: date,
        income: income,
        expensesByCategory: expensesByCategory,
        savings: savings,
      ),
    );
    notifyListeners();
  }
}
