import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/financial_calculator.dart';
import '../viewmodels/finance_view_model.dart';

class HowAmIDoingView extends StatelessWidget {
  const HowAmIDoingView({super.key});

  @override
  Widget build(BuildContext context) {
    final summary = context.watch<FinanceViewModel>().summary;
    final presentation = _presentationFor(summary.insight);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Card(
          color: presentation.color.withValues(alpha: 0.10),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 34,
                  backgroundColor: presentation.color,
                  foregroundColor: Colors.white,
                  child: Icon(presentation.icon, size: 34),
                ),
                const SizedBox(height: 18),
                Text(
                  summary.insight.message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: presentation.color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  summary.dayCount == 0
                      ? 'Your insight uses up to 7 daily records.'
                      : 'Based on ${summary.dayCount} day${summary.dayCount == 1 ? '' : 's'} of in-memory data.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text('Your ratios', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        _RatioCard(
          title: 'Expenses vs. income',
          ratio: summary.expenseRatio,
          target: 0.30,
          color: const Color(0xFFB54747),
          targetLabel: 'Target: 30% or less',
        ),
        const SizedBox(height: 12),
        _RatioCard(
          title: 'Savings vs. income',
          ratio: summary.savingsRatio,
          target: 0.30,
          color: const Color(0xFF147D64),
          targetLabel: 'Above 30% means saving well',
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How insights work',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 10),
                const Text('• Expenses above 30% of income: overspending'),
                const Text('• Savings from 10% through 30%: balanced budget'),
                const Text('• Savings above 30%: saving well'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  _InsightPresentation _presentationFor(FinancialInsight insight) =>
      switch (insight) {
        FinancialInsight.overspending => const _InsightPresentation(
          color: Color(0xFFB54747),
          icon: Icons.warning_amber_rounded,
        ),
        FinancialInsight.savingWell => const _InsightPresentation(
          color: Color(0xFF147D64),
          icon: Icons.emoji_events_outlined,
        ),
        FinancialInsight.balanced => const _InsightPresentation(
          color: Color(0xFF3266A8),
          icon: Icons.balance_outlined,
        ),
        FinancialInsight.lowSavings => const _InsightPresentation(
          color: Color(0xFFC17817),
          icon: Icons.savings_outlined,
        ),
        FinancialInsight.noData ||
        FinancialInsight.noIncome => const _InsightPresentation(
          color: Color(0xFF687076),
          icon: Icons.info_outline,
        ),
      };
}

class _RatioCard extends StatelessWidget {
  const _RatioCard({
    required this.title,
    required this.ratio,
    required this.target,
    required this.color,
    required this.targetLabel,
  });

  final String title;
  final double ratio;
  final double target;
  final Color color;
  final String targetLabel;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(title)),
                Text(
                  NumberFormat.percentPattern().format(ratio),
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            LinearProgressIndicator(
              value: (ratio / (target * 2)).clamp(0.0, 1.0),
              color: color,
              minHeight: 9,
              borderRadius: BorderRadius.circular(8),
            ),
            const SizedBox(height: 6),
            Text(targetLabel, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _InsightPresentation {
  const _InsightPresentation({required this.color, required this.icon});

  final Color color;
  final IconData icon;
}
