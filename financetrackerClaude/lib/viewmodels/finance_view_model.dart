import 'package:flutter/foundation.dart';

import '../models/daily_record.dart';
import '../models/expense_category.dart';
import '../models/financial_calculator.dart';
import '../repositories/finance_repository.dart';

class FinanceViewModel extends ChangeNotifier {
  final FinanceRepository _repository;

  FinanceViewModel(this._repository);

  List<DailyRecord> get records => _repository.records;
  FinancialSummary get summary => FinancialCalculator.summarize(records);
  FinancialInsight get insight => FinancialCalculator.evaluate(summary);

  /// Returns an error message if the input is invalid, otherwise saves the
  /// record and returns null.
  String? submit({
    required DateTime date,
    required double? income,
    required double? savings,
    required Map<ExpenseCategory, double> expenses,
  }) {
    if (income == null || income < 0) return 'Enter a valid income.';
    if (savings == null || savings < 0) return 'Enter a valid savings amount.';
    if (expenses.values.any((v) => v < 0)) {
      return 'Expenses cannot be negative.';
    }
    _repository.add(DailyRecord(
      date: date,
      income: income,
      savings: savings,
      expensesByCategory: expenses,
    ));
    notifyListeners();
    return null;
  }
}
