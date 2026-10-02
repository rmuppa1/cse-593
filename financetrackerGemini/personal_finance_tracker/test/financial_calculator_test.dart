// Comprehensive unit tests verifying all three financial insight calculation rules and edge cases.
import 'package:flutter_test/flutter_test.dart';
import 'package:personal_finance_tracker/models/financial_calculator.dart';

void main() {
  group('Financial Insights Calculation Logic (Project Specification Rules)', () {
    test('Rule 1: Triggers "You are overspending!" when expenses > 30% of income', () {
      // Income = $1000, Expenses = $350 (35% > 30%), Savings = $50 (5%)
      final insights = FinancialCalculator.calculateInsights(
        cumulativeIncome: 1000.0,
        cumulativeExpenses: 350.0,
        cumulativeSavings: 50.0,
        dayCount: 7,
      );

      expect(insights, contains('You are overspending!'));
      expect(insights, isNot(contains('You have a balanced budget!')));
      expect(insights, isNot(contains('You are saving well!')));
    });

    test('Rule 2: Triggers "You have a balanced budget!" when savings is between 10% and 30% of income', () {
      // Income = $1000, Expenses = $200 (20%), Savings = $200 (20% -> between 10% and 30%)
      final insights = FinancialCalculator.calculateInsights(
        cumulativeIncome: 1000.0,
        cumulativeExpenses: 200.0,
        cumulativeSavings: 200.0,
        dayCount: 7,
      );

      expect(insights, contains('You have a balanced budget!'));
      expect(insights, isNot(contains('You are overspending!')));
      expect(insights, isNot(contains('You are saving well!')));
    });

    test('Rule 2 Boundary: Savings at exactly 10% and 30% triggers balanced budget', () {
      final insightsAt10 = FinancialCalculator.calculateInsights(
        cumulativeIncome: 1000.0,
        cumulativeExpenses: 200.0,
        cumulativeSavings: 100.0, // 10%
        dayCount: 7,
      );
      expect(insightsAt10, contains('You have a balanced budget!'));

      final insightsAt30 = FinancialCalculator.calculateInsights(
        cumulativeIncome: 1000.0,
        cumulativeExpenses: 200.0,
        cumulativeSavings: 300.0, // 30%
        dayCount: 7,
      );
      expect(insightsAt30, contains('You have a balanced budget!'));
    });

    test('Rule 3: Triggers "You are saving well!" when savings > 30% of income', () {
      // Income = $1000, Expenses = $250 (25%), Savings = $350 (35% > 30%)
      final insights = FinancialCalculator.calculateInsights(
        cumulativeIncome: 1000.0,
        cumulativeExpenses: 250.0,
        cumulativeSavings: 350.0,
        dayCount: 7,
      );

      expect(insights, contains('You are saving well!'));
      expect(insights, isNot(contains('You have a balanced budget!')));
      expect(insights, isNot(contains('You are overspending!')));
    });

    test('Edge Case: Zero income with expenses triggers overspending', () {
      final insights = FinancialCalculator.calculateInsights(
        cumulativeIncome: 0.0,
        cumulativeExpenses: 150.0,
        cumulativeSavings: 0.0,
        dayCount: 1,
      );

      expect(insights, contains('You are overspending!'));
    });

    test('Edge Case: Simultaneous overspending (>30% exp) and high savings (>30% sav)', () {
      // Cumulative Income = $1000, Expenses = $400 (40%), Savings = $400 (40%)
      final insights = FinancialCalculator.calculateInsights(
        cumulativeIncome: 1000.0,
        cumulativeExpenses: 400.0,
        cumulativeSavings: 400.0,
        dayCount: 7,
      );

      expect(insights, contains('You are overspending!'));
      expect(insights, contains('You are saving well!'));
    });
  });
}
