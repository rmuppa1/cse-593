// Immutable data model holding a single day's financial data.
import 'expense_category.dart';

class DailyRecord {
  final DateTime date;
  final double totalIncome;
  final double totalExpenses;
  final Map<ExpenseCategory, double> categoryExpenses;
  final double savings;

  const DailyRecord({
    required this.date,
    required this.totalIncome,
    required this.totalExpenses,
    required this.categoryExpenses,
    required this.savings,
  });
}
