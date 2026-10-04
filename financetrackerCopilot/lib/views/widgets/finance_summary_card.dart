import 'package:flutter/material.dart';

class FinanceSummaryCard extends StatelessWidget {
  const FinanceSummaryCard({
    super.key,
    required this.title,
    required this.amount,
    this.color,
    this.badge,
  });

  final String title;
  final double amount;
  final Color? color;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.primary;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 4),
            Text(
              '\$${amount.toStringAsFixed(2)}',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(color: c, fontWeight: FontWeight.bold),
            ),
            if (badge != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Chip(
                  label: Text(badge!),
                  visualDensity: VisualDensity.compact,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
