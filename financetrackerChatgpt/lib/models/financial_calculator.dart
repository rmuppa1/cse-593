import 'daily_record.dart';

enum FinancialInsight {
  noData('Add financial data to see your insight.'),
  noIncome('Income is needed to evaluate your financial health.'),
  overspending('You are overspending!'),
  balanced('You have a balanced budget!'),
  savingWell('You are saving well!'),
  lowSavings('Try to save at least 10% of your income.');

  const FinancialInsight(this.message);

  final String message;
}

class FinancialSummary {
  const FinancialSummary({
    required this.dayCount,
    required this.totalIncome,
    required this.totalExpenses,
    required this.totalSavings,
    required this.insight,
  });

  final int dayCount;
  final double totalIncome;
  final double totalExpenses;
  final double totalSavings;
  final FinancialInsight insight;

  double get averageDailyIncome => dayCount == 0 ? 0 : totalIncome / dayCount;
  double get averageDailyExpenses =>
      dayCount == 0 ? 0 : totalExpenses / dayCount;
  double get averageDailySavings => dayCount == 0 ? 0 : totalSavings / dayCount;
  double get expenseRatio => totalIncome == 0 ? 0 : totalExpenses / totalIncome;
  double get savingsRatio => totalIncome == 0 ? 0 : totalSavings / totalIncome;
}

class FinancialCalculator {
  const FinancialCalculator._();

  static FinancialSummary summarize(Iterable<DailyRecord> records) {
    final data = records.toList(growable: false);
    final income = data.fold<double>(0, (sum, item) => sum + item.income);
    final expenses = data.fold<double>(
      0,
      (sum, item) => sum + item.totalExpenses,
    );
    final savings = data.fold<double>(0, (sum, item) => sum + item.savings);

    return FinancialSummary(
      dayCount: data.length,
      totalIncome: income,
      totalExpenses: expenses,
      totalSavings: savings,
      insight: calculateInsight(
        dayCount: data.length,
        totalIncome: income,
        totalExpenses: expenses,
        totalSavings: savings,
      ),
    );
  }

  static FinancialInsight calculateInsight({
    required int dayCount,
    required double totalIncome,
    required double totalExpenses,
    required double totalSavings,
  }) {
    if (dayCount == 0) return FinancialInsight.noData;
    if (totalIncome <= 0) return FinancialInsight.noIncome;

    final expenseRatio = totalExpenses / totalIncome;
    final savingsRatio = totalSavings / totalIncome;

    if (expenseRatio > 0.30) return FinancialInsight.overspending;
    if (savingsRatio > 0.30) return FinancialInsight.savingWell;
    if (savingsRatio >= 0.10) return FinancialInsight.balanced;
    return FinancialInsight.lowSavings;
  }
}
