import 'dart:collection';

import 'expense_category.dart';

class DailyRecord {
  DailyRecord({
    required DateTime date,
    required this.income,
    required Map<ExpenseCategory, double> expensesByCategory,
    required this.savings,
  }) : date = DateTime(date.year, date.month, date.day),
       expensesByCategory = UnmodifiableMapView({
         for (final category in ExpenseCategory.values)
           category: expensesByCategory[category] ?? 0,
       }) {
    if (income < 0 ||
        savings < 0 ||
        expensesByCategory.values.any((value) => value < 0)) {
      throw ArgumentError('Financial amounts cannot be negative.');
    }
  }

  final DateTime date;
  final double income;
  final Map<ExpenseCategory, double> expensesByCategory;
  final double savings;

  double get totalExpenses =>
      expensesByCategory.values.fold(0, (sum, amount) => sum + amount);
}
