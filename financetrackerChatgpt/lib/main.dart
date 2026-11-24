import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'repositories/finance_repository.dart';
import 'viewmodels/finance_view_model.dart';
import 'views/main_navigation_view.dart';

void main() {
  runApp(const PersonalFinanceTrackerApp());
}

class PersonalFinanceTrackerApp extends StatelessWidget {
  const PersonalFinanceTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => FinanceViewModel(FinanceRepository()),
      child: MaterialApp(
        title: 'Personal Finance Tracker',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF176B5B),
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFFF5F7F4),
          cardTheme: const CardThemeData(elevation: 0, margin: EdgeInsets.zero),
          inputDecorationTheme: const InputDecorationTheme(
            border: OutlineInputBorder(),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        home: const MainNavigationView(),
      ),
    );
  }
}
