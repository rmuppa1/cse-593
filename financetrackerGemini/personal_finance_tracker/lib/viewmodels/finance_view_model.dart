// ChangeNotifier ViewModel exposing reactive 7-day state, metrics, insights, and input handling.
import 'package:flutter/foundation.dart';
import '../models/daily_record.dart';
import '../models/expense_category.dart';
import '../models/financial_calculator.dart';
import '../repositories/finance_repository.dart';

class FinanceViewModel extends ChangeNotifier {
  final FinanceRepository _repository;

  FinanceViewModel(this._repository);

  List<DailyRecord> get records => _repository.getRecent7Days();

  int get dayCount => records.length;
  double get cumulativeIncome => FinancialCalculator.sumIncome(records);
  double get cumulativeExpenses => FinancialCalculator.sumExpenses(records);
  double get cumulativeSavings => FinancialCalculator.sumSavings(records);

  double get avgDailyIncome => dayCount == 0 ? 0.0 : cumulativeIncome / dayCount;
  double get avgDailyExpenses => dayCount == 0 ? 0.0 : cumulativeExpenses / dayCount;
  double get avgDailySavings => dayCount == 0 ? 0.0 : cumulativeSavings / dayCount;

  List<String> get insights => FinancialCalculator.calculateInsights(
        cumulativeIncome: cumulativeIncome,
        cumulativeExpenses: cumulativeExpenses,
        cumulativeSavings: cumulativeSavings,
        dayCount: dayCount,
      );

  Map<ExpenseCategory, double> get cumulativeExpensesByCategory {
    final Map<ExpenseCategory, double> breakdown = {
      for (var cat in ExpenseCategory.values) cat: 0.0,
    };
    for (final record in records) {
      record.categoryExpenses.forEach((category, amount) {
        breakdown[category] = (breakdown[category] ?? 0.0) + amount;
      });
    }
    return breakdown;
  }

  bool addDailyRecord({
    required double income,
    required double expenses,
    required Map<ExpenseCategory, double> categoryExpenses,
    required double savings,
  }) {
    if (income < 0 || expenses < 0 || savings < 0) return false;

    final record = DailyRecord(
      date: DateTime.now(),
      totalIncome: income,
      totalExpenses: expenses,
      categoryExpenses: categoryExpenses,
      savings: savings,
    );

    _repository.addRecord(record);
    notifyListeners();
    return true;
  }

  void clearAllRecords() {
    _repository.clear();
    notifyListeners();
  }
}
