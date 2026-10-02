// Pure domain logic computing 7-day cumulative metrics and financial insight messages.
import 'daily_record.dart';

class FinancialCalculator {
  /// Evaluates financial insights according to cumulative 7-day figures.
  /// 
  /// Rules:
  /// 1. Average daily expenses exceed 30% of income -> "You are overspending!"
  /// 2. Average daily savings is between 10% and 30% of income -> "You have a balanced budget!"
  /// 3. Average daily savings exceeds 30% of income -> "You are saving well!"
  /// 
  /// Note: (avgExpenses / avgIncome) is mathematically equivalent to (cumulativeExpenses / cumulativeIncome).
  static List<String> calculateInsights({
    required double cumulativeIncome,
    required double cumulativeExpenses,
    required double cumulativeSavings,
    required int dayCount,
  }) {
    if (dayCount == 0 || cumulativeIncome <= 0.0) {
      if (cumulativeExpenses > 0.0) {
        return const ['You are overspending!'];
      }
      return const ['No sufficient income data to generate insights.'];
    }

    final double expenseRatio = cumulativeExpenses / cumulativeIncome;
    final double savingsRatio = cumulativeSavings / cumulativeIncome;

    final List<String> insights = [];

    // Rule 1: If average daily expenses exceed 30% of income -> "You are overspending!"
    if (expenseRatio > 0.30) {
      insights.add('You are overspending!');
    }

    // Rule 2: If average daily savings is between 10% and 30% of income -> "You have a balanced budget!"
    if (savingsRatio >= 0.10 && savingsRatio <= 0.30) {
      insights.add('You have a balanced budget!');
    }

    // Rule 3: If average daily savings exceeds 30% of income -> "You are saving well!"
    if (savingsRatio > 0.30) {
      insights.add('You are saving well!');
    }

    if (insights.isEmpty) {
      insights.add('Your budget does not match specific insight criteria.');
    }

    return insights;
  }

  static double sumIncome(List<DailyRecord> records) =>
      records.fold(0.0, (acc, r) => acc + r.totalIncome);

  static double sumExpenses(List<DailyRecord> records) =>
      records.fold(0.0, (acc, r) => acc + r.totalExpenses);

  static double sumSavings(List<DailyRecord> records) =>
      records.fold(0.0, (acc, r) => acc + r.savings);
}
