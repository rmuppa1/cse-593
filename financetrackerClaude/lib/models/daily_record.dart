import 'expense_category.dart';

/// Immutable snapshot of one day's finances, in dollars.
class DailyRecord {
  final DateTime date;
  final double income;
  final double savings;
  final Map<ExpenseCategory, double> expensesByCategory;

  DailyRecord({
    required DateTime date,
    required this.income,
    required this.savings,
    required Map<ExpenseCategory, double> expensesByCategory,
  })  : date = DateTime(date.year, date.month, date.day),
        expensesByCategory = Map.unmodifiable({
          for (final c in ExpenseCategory.values) c: expensesByCategory[c] ?? 0.0,
        });

  double get totalExpenses =>
      expensesByCategory.values.fold(0.0, (sum, v) => sum + v);
}
