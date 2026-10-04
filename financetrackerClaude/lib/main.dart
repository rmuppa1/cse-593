import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'repositories/finance_repository.dart';
import 'viewmodels/finance_view_model.dart';
import 'views/main_navigation_view.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => FinanceViewModel(FinanceRepository()),
      child: const PersonalFinanceTrackerApp(),
    ),
  );
}

class PersonalFinanceTrackerApp extends StatelessWidget {
  const PersonalFinanceTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Personal Finance Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: const MainNavigationView(),
    );
  }
}
