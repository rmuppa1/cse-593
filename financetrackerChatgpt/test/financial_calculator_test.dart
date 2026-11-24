import 'package:flutter_test/flutter_test.dart';
import 'package:personal_finance_tracker/models/daily_record.dart';
import 'package:personal_finance_tracker/models/expense_category.dart';
import 'package:personal_finance_tracker/models/financial_calculator.dart';

void main() {
  group('FinancialCalculator.calculateInsight', () {
    test('reports overspending when expenses exceed 30% of income', () {
      final insight = FinancialCalculator.calculateInsight(
        dayCount: 7,
        totalIncome: 1000,
        totalExpenses: 301,
        totalSavings: 400,
      );

      expect(insight, FinancialInsight.overspending);
      expect(insight.message, 'You are overspending!');
    });

    test('30% expenses is not overspending', () {
      final insight = FinancialCalculator.calculateInsight(
        dayCount: 7,
        totalIncome: 1000,
        totalExpenses: 300,
        totalSavings: 200,
      );

      expect(insight, FinancialInsight.balanced);
    });

    test('reports balanced for exactly 10% savings', () {
      final insight = FinancialCalculator.calculateInsight(
        dayCount: 7,
        totalIncome: 1000,
        totalExpenses: 300,
        totalSavings: 100,
      );

      expect(insight, FinancialInsight.balanced);
      expect(insight.message, 'You have a balanced budget!');
    });

    test('reports balanced for exactly 30% savings', () {
      final insight = FinancialCalculator.calculateInsight(
        dayCount: 7,
        totalIncome: 1000,
        totalExpenses: 300,
        totalSavings: 300,
      );

      expect(insight, FinancialInsight.balanced);
    });

    test('reports saving well when savings exceed 30%', () {
      final insight = FinancialCalculator.calculateInsight(
        dayCount: 7,
        totalIncome: 1000,
        totalExpenses: 250,
        totalSavings: 301,
      );

      expect(insight, FinancialInsight.savingWell);
      expect(insight.message, 'You are saving well!');
    });

    test('overspending takes priority when both high expense and savings ratios apply', () {
      final insight = FinancialCalculator.calculateInsight(
        dayCount: 7,
        totalIncome: 1000,
        totalExpenses: 400,
        totalSavings: 400,
      );

      expect(insight, FinancialInsight.overspending);
    });

    test('handles no data and zero income without dividing by zero', () {
      expect(
        FinancialCalculator.calculateInsight(
          dayCount: 0,
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
        ),
        FinancialInsight.noData,
      );
      expect(
        FinancialCalculator.calculateInsight(
          dayCount: 1,
          totalIncome: 0,
          totalExpenses: 10,
          totalSavings: 0,
        ),
        FinancialInsight.noIncome,
      );
    });

    test('returns guidance when savings are below 10%', () {
      final insight = FinancialCalculator.calculateInsight(
        dayCount: 1,
        totalIncome: 1000,
        totalExpenses: 100,
        totalSavings: 99,
      );

      expect(insight, FinancialInsight.lowSavings);
    });
  });

  test('summarize calculates cumulative values and daily averages', () {
    final records = [
      _record(income: 100, expenses: 20, savings: 15),
      _record(income: 200, expenses: 40, savings: 35),
    ];

    final summary = FinancialCalculator.summarize(records);

    expect(summary.dayCount, 2);
    expect(summary.totalIncome, 300);
    expect(summary.totalExpenses, 60);
    expect(summary.totalSavings, 50);
    expect(summary.averageDailyIncome, 150);
    expect(summary.averageDailyExpenses, 30);
    expect(summary.averageDailySavings, 25);
    expect(summary.insight, FinancialInsight.balanced);
  });
}

DailyRecord _record({
  required double income,
  required double expenses,
  required double savings,
}) {
  return DailyRecord(
    date: DateTime(2026, 1, 1),
    income: income,
    expensesByCategory: {ExpenseCategory.food: expenses},
    savings: savings,
  );
}
