import 'package:flutter_test/flutter_test.dart';
import 'package:personal_finance_tracker/models/daily_record.dart';
import 'package:personal_finance_tracker/models/expense_category.dart';
import 'package:personal_finance_tracker/models/financial_calculator.dart';
import 'package:personal_finance_tracker/repositories/finance_repository.dart';

DailyRecord rec(double income, double expenses, double savings,
        {DateTime? date}) =>
    DailyRecord(
      date: date ?? DateTime(2026, 1, 1),
      income: income,
      savings: savings,
      expenseByCategory: {ExpenseCategory.food: expenses},
    );

void main() {
  group('FinancialCalculator.evaluate', () {
    test('no records -> noData', () {
      expect(FinancialCalculator.evaluate([]), FinancialInsight.noData);
    });

    test('zero income -> noData', () {
      expect(FinancialCalculator.evaluate([rec(0, 0, 0)]),
          FinancialInsight.noData);
    });

    test('expenses above 30% of income -> overspending', () {
      final r = [rec(100, 31, 0), rec(100, 31, 0)];
      expect(FinancialCalculator.evaluate(r), FinancialInsight.overspending);
      expect(FinancialInsight.overspending.message, 'You are overspending!');
    });

    test('expenses exactly 30% are not overspending', () {
      expect(FinancialCalculator.evaluate([rec(100, 30, 20)]),
          FinancialInsight.balanced);
    });

    test('overspending takes priority over high savings', () {
      expect(FinancialCalculator.evaluate([rec(100, 40, 50)]),
          FinancialInsight.overspending);
    });

    test('savings between 10% and 30% -> balanced', () {
      expect(FinancialCalculator.evaluate([rec(100, 10, 20)]),
          FinancialInsight.balanced);
      expect(FinancialInsight.balanced.message, 'You have a balanced budget!');
    });

    test('savings exactly 10% and 30% are balanced', () {
      expect(FinancialCalculator.evaluate([rec(100, 10, 10)]),
          FinancialInsight.balanced);
      expect(FinancialCalculator.evaluate([rec(100, 10, 30)]),
          FinancialInsight.balanced);
    });

    test('savings above 30% -> saving well', () {
      expect(FinancialCalculator.evaluate([rec(100, 10, 31)]),
          FinancialInsight.savingWell);
      expect(FinancialInsight.savingWell.message, 'You are saving well!');
    });

    test('savings below 10% -> overspending', () {
      expect(FinancialCalculator.evaluate([rec(100, 10, 5)]),
          FinancialInsight.overspending);
    });

    test('uses 7-day averages across records', () {
      final r = [rec(100, 10, 40), rec(300, 30, 20)];
      expect(FinancialCalculator.averageDailyIncome(r), 200);
      expect(FinancialCalculator.averageDailyExpenses(r), 20);
      expect(FinancialCalculator.averageDailySavings(r), 30);
      expect(FinancialCalculator.evaluate(r), FinancialInsight.balanced);
    });
  });

  group('FinanceRepository', () {
    test('keeps only the most recent 7 days', () {
      final repo = FinanceRepository();
      for (var i = 1; i <= 9; i++) {
        repo.save(rec(100, 10, 10, date: DateTime(2026, 1, i)));
      }
      expect(repo.records.length, 7);
      expect(repo.records.first.date, DateTime(2026, 1, 3));
    });

    test('same date replaces existing record', () {
      final repo = FinanceRepository();
      repo.save(rec(100, 10, 10));
      repo.save(rec(200, 10, 10));
      expect(repo.records.length, 1);
      expect(repo.records.single.income, 200);
    });
  });
}
