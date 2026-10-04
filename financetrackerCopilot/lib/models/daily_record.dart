import 'expense_category.dart';

class DailyRecord {
  final DateTime date;
  final double income;
  final double savings;
  final Map<ExpenseCategory, double> expenseByCategory;

  DailyRecord({
    required DateTime date,
    required this.income,
    required this.savings,
    Map<ExpenseCategory, double> expenseByCategory = const {},
  })  : date = DateTime(date.year, date.month, date.day),
        expenseByCategory = Map.unmodifiable({
          for (final c in ExpenseCategory.values) c: expenseByCategory[c] ?? 0.0,
        });

  double get totalExpenses =>
      expenseByCategory.values.fold(0.0, (sum, v) => sum + v);
}
