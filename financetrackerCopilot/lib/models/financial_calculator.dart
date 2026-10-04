import 'daily_record.dart';

enum FinancialInsight {
  noData('Add some financial data to see your insights.'),
  overspending('You are overspending!'),
  balanced('You have a balanced budget!'),
  savingWell('You are saving well!');

  const FinancialInsight(this.message);

  final String message;
}

class FinancialCalculator {
  static const double overspendingThreshold = 0.30;
  static const double balancedMinSavings = 0.10;
  static const double savingWellThreshold = 0.30;

  static double totalIncome(List<DailyRecord> records) =>
      records.fold(0.0, (s, r) => s + r.income);

  static double totalExpenses(List<DailyRecord> records) =>
      records.fold(0.0, (s, r) => s + r.totalExpenses);

  static double totalSavings(List<DailyRecord> records) =>
      records.fold(0.0, (s, r) => s + r.savings);

  static double averageDailyIncome(List<DailyRecord> records) =>
      records.isEmpty ? 0.0 : totalIncome(records) / records.length;

  static double averageDailyExpenses(List<DailyRecord> records) =>
      records.isEmpty ? 0.0 : totalExpenses(records) / records.length;

  static double averageDailySavings(List<DailyRecord> records) =>
      records.isEmpty ? 0.0 : totalSavings(records) / records.length;

  /// Average daily expenses as a fraction of average daily income (0 if no income).
  static double expenseRatio(List<DailyRecord> records) {
    final income = averageDailyIncome(records);
    return income <= 0 ? 0.0 : averageDailyExpenses(records) / income;
  }

  /// Average daily savings as a fraction of average daily income (0 if no income).
  static double savingsRatio(List<DailyRecord> records) {
    final income = averageDailyIncome(records);
    return income <= 0 ? 0.0 : averageDailySavings(records) / income;
  }

  static FinancialInsight evaluate(List<DailyRecord> records) {
    if (records.isEmpty || averageDailyIncome(records) <= 0) {
      return FinancialInsight.noData;
    }
    if (expenseRatio(records) > overspendingThreshold) {
      return FinancialInsight.overspending;
    }
    final savings = savingsRatio(records);
    if (savings > savingWellThreshold) return FinancialInsight.savingWell;
    if (savings >= balancedMinSavings) return FinancialInsight.balanced;
    return FinancialInsight.overspending;
  }
}
