import 'package:flutter_test/flutter_test.dart';
import 'package:personal_finance_tracker/models/daily_record.dart';
import 'package:personal_finance_tracker/models/expense_category.dart';
import 'package:personal_finance_tracker/models/financial_calculator.dart';
import 'package:personal_finance_tracker/repositories/finance_repository.dart';

DailyRecord day({
  required double income,
  required double expenses,
  required double savings,
  int dayOffset = 0,
}) =>
    DailyRecord(
      date: DateTime(2026, 1, 1).add(Duration(days: dayOffset)),
      income: income,
      savings: savings,
      expensesByCategory: {ExpenseCategory.food: expenses},
    );

InsightType typeOf(List<DailyRecord> r) =>
    FinancialCalculator.evaluateRecords(r).type;

void main() {
  group('summary', () {
    test('computes totals, averages and ratios', () {
      final s = FinancialCalculator.summarize([
        day(income: 100, expenses: 20, savings: 30, dayOffset: 0),
        day(income: 200, expenses: 40, savings: 50, dayOffset: 1),
      ]);
      expect(s.totalIncome, 300);
      expect(s.totalExpenses, 60);
      expect(s.avgDailyIncome, 150);
      expect(s.avgDailyExpenses, 30);
      expect(s.avgDailySavings, 40);
      expect(s.expenseRatio, closeTo(0.2, 1e-9));
      expect(s.savingsRatio, closeTo(40 / 150, 1e-9));
    });

    test('sums category totals', () {
      final s = FinancialCalculator.summarize([
        DailyRecord(
          date: DateTime(2026, 1, 1),
          income: 100,
          savings: 0,
          expensesByCategory: {
            ExpenseCategory.food: 10,
            ExpenseCategory.rentMortgage: 50,
          },
        ),
      ]);
      expect(s.categoryTotals[ExpenseCategory.food], 10);
      expect(s.categoryTotals[ExpenseCategory.rentMortgage], 50);
      expect(s.categoryTotals[ExpenseCategory.entertainment], 0);
      expect(s.totalExpenses, 60);
    });
  });

  group('insights', () {
    test('overspending when expenses exceed 30% of income', () {
      final i = FinancialCalculator.evaluateRecords(
          [day(income: 100, expenses: 31, savings: 5)]);
      expect(i.type, InsightType.overspending);
      expect(i.message, 'You are overspending!');
    });

    test('exactly 30% expenses is not overspending', () {
      expect(typeOf([day(income: 100, expenses: 30, savings: 20)]),
          InsightType.balanced);
    });

    test('balanced when savings between 10% and 30%', () {
      final i = FinancialCalculator.evaluateRecords(
          [day(income: 100, expenses: 20, savings: 20)]);
      expect(i.type, InsightType.balanced);
      expect(i.message, 'You have a balanced budget!');
    });

    test('savings boundaries: 10% and 30% are balanced', () {
      expect(typeOf([day(income: 100, expenses: 10, savings: 10)]),
          InsightType.balanced);
      expect(typeOf([day(income: 100, expenses: 10, savings: 30)]),
          InsightType.balanced);
    });

    test('saving well when savings exceed 30%', () {
      final i = FinancialCalculator.evaluateRecords(
          [day(income: 100, expenses: 10, savings: 30.01)]);
      expect(i.type, InsightType.savingWell);
      expect(i.message, 'You are saving well!');
    });

    test('overspending takes priority over high savings', () {
      expect(typeOf([day(income: 100, expenses: 50, savings: 50)]),
          InsightType.overspending);
    });

    test('savings below 10% with low expenses gives neutral insight', () {
      expect(typeOf([day(income: 100, expenses: 10, savings: 5)]),
          InsightType.needsAttention);
    });

    test('uses cumulative values across days', () {
      // Day 1 overspends, but the 7-day totals are fine.
      expect(
        typeOf([
          day(income: 100, expenses: 50, savings: 0, dayOffset: 0),
          day(income: 300, expenses: 10, savings: 150, dayOffset: 1),
        ]),
        InsightType.savingWell,
      );
    });

    test('no data and zero income', () {
      expect(typeOf([]), InsightType.noData);
      expect(typeOf([day(income: 0, expenses: 10, savings: 0)]),
          InsightType.noData);
    });
  });

  group('repository', () {
    test('keeps only the 7 most recent days', () {
      final repo = FinanceRepository();
      for (var i = 0; i < 10; i++) {
        repo.add(day(income: 100, expenses: 10, savings: 5, dayOffset: i));
      }
      expect(repo.records.length, 7);
      expect(repo.records.first.date, DateTime(2026, 1, 4));
      expect(repo.records.last.date, DateTime(2026, 1, 10));
    });

    test('same date replaces existing record', () {
      final repo = FinanceRepository();
      repo.add(day(income: 100, expenses: 10, savings: 5));
      repo.add(day(income: 200, expenses: 10, savings: 5));
      expect(repo.records.length, 1);
      expect(repo.records.single.income, 200);
    });
  });
}
