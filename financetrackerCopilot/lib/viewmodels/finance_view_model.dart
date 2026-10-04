import 'package:flutter/foundation.dart';

import '../models/daily_record.dart';
import '../models/expense_category.dart';
import '../models/financial_calculator.dart';
import '../repositories/finance_repository.dart';

class FinanceViewModel extends ChangeNotifier {
  FinanceViewModel(this._repository);

  final FinanceRepository _repository;

  List<DailyRecord> get records => _repository.records;
  double get totalIncome => FinancialCalculator.totalIncome(records);
  double get totalExpenses => FinancialCalculator.totalExpenses(records);
  double get totalSavings => FinancialCalculator.totalSavings(records);
  double get averageDailyIncome =>
      FinancialCalculator.averageDailyIncome(records);
  double get averageDailyExpenses =>
      FinancialCalculator.averageDailyExpenses(records);
  double get averageDailySavings =>
      FinancialCalculator.averageDailySavings(records);
  double get expenseRatio => FinancialCalculator.expenseRatio(records);
  double get savingsRatio => FinancialCalculator.savingsRatio(records);
  FinancialInsight get insight => FinancialCalculator.evaluate(records);

  Map<ExpenseCategory, double> get categoryTotals => {
        for (final c in ExpenseCategory.values)
          c: records.fold(0.0, (s, r) => s + (r.expenseByCategory[c] ?? 0)),
      };

  void addRecord({
    required DateTime date,
    required double income,
    required double savings,
    required Map<ExpenseCategory, double> expenses,
  }) {
    _repository.save(DailyRecord(
      date: date,
      income: income,
      savings: savings,
      expenseByCategory: expenses,
    ));
    notifyListeners();
  }
}
