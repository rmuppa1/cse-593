import 'daily_record.dart';
import 'expense_category.dart';

enum InsightType { noData, overspending, balanced, savingWell, needsAttention }

class FinancialInsight {
  final InsightType type;
  final String message;

  const FinancialInsight(this.type, this.message);
}

/// 7-day cumulative metrics. Averages are per recorded day.
class FinancialSummary {
  final int dayCount;
  final double totalIncome;
  final double totalExpenses;
  final double totalSavings;
  final Map<ExpenseCategory, double> categoryTotals;

  const FinancialSummary({
    required this.dayCount,
    required this.totalIncome,
    required this.totalExpenses,
    required this.totalSavings,
    required this.categoryTotals,
  });

  double get avgDailyIncome => dayCount == 0 ? 0 : totalIncome / dayCount;
  double get avgDailyExpenses => dayCount == 0 ? 0 : totalExpenses / dayCount;
  double get avgDailySavings => dayCount == 0 ? 0 : totalSavings / dayCount;

  /// Average daily expenses as a fraction of income (0.3 == 30%).
  double get expenseRatio =>
      totalIncome <= 0 ? 0 : avgDailyExpenses / avgDailyIncome;

  /// Average daily savings as a fraction of income.
  double get savingsRatio =>
      totalIncome <= 0 ? 0 : avgDailySavings / avgDailyIncome;
}

/// Pure domain logic; no Flutter dependencies.
class FinancialCalculator {
  static const double expenseThreshold = 0.30;
  static const double savingsLowThreshold = 0.10;
  static const double savingsHighThreshold = 0.30;

  static const overspendingMessage = 'You are overspending!';
  static const balancedMessage = 'You have a balanced budget!';
  static const savingWellMessage = 'You are saving well!';

  static FinancialSummary summarize(List<DailyRecord> records) {
    final totals = {for (final c in ExpenseCategory.values) c: 0.0};
    var income = 0.0, expenses = 0.0, savings = 0.0;
    for (final r in records) {
      income += r.income;
      expenses += r.totalExpenses;
      savings += r.savings;
      for (final c in ExpenseCategory.values) {
        totals[c] = totals[c]! + (r.expensesByCategory[c] ?? 0);
      }
    }
    return FinancialSummary(
      dayCount: records.length,
      totalIncome: income,
      totalExpenses: expenses,
      totalSavings: savings,
      categoryTotals: totals,
    );
  }

  /// Rules, in priority order:
  /// 1. avg expenses > 30% of income -> overspending
  /// 2. avg savings > 30% of income -> saving well
  /// 3. avg savings in [10%, 30%] of income -> balanced
  /// Anything else (e.g. savings under 10%) gets a neutral nudge.
  static FinancialInsight evaluate(FinancialSummary s) {
    if (s.dayCount == 0 || s.totalIncome <= 0) {
      return const FinancialInsight(
        InsightType.noData,
        'Enter income for at least one day to see insights.',
      );
    }
    if (s.expenseRatio > expenseThreshold) {
      return const FinancialInsight(
          InsightType.overspending, overspendingMessage);
    }
    if (s.savingsRatio > savingsHighThreshold) {
      return const FinancialInsight(
          InsightType.savingWell, savingWellMessage);
    }
    if (s.savingsRatio >= savingsLowThreshold) {
      return const FinancialInsight(InsightType.balanced, balancedMessage);
    }
    return const FinancialInsight(
      InsightType.needsAttention,
      'Your savings are below 10% of income. Try to set a little more aside.',
    );
  }

  static FinancialInsight evaluateRecords(List<DailyRecord> records) =>
      evaluate(summarize(records));
}
