import 'package:flutter/material.dart';

import 'enter_data_view.dart';
import 'how_am_i_doing_view.dart';
import 'view_finances_view.dart';

class MainNavigationView extends StatefulWidget {
  const MainNavigationView({super.key});

  @override
  State<MainNavigationView> createState() => _MainNavigationViewState();
}

class _MainNavigationViewState extends State<MainNavigationView> {
  int _index = 0;

  static const _titles = ['Enter Data', 'My Finances', 'How Am I Doing?'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_titles[_index])),
      body: IndexedStack(
        index: _index,
        children: const [
          EnterDataView(),
          ViewFinancesView(),
          HowAmIDoingView(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.edit_note), label: 'Enter Data'),
          NavigationDestination(
              icon: Icon(Icons.bar_chart), label: 'My Finances'),
          NavigationDestination(
              icon: Icon(Icons.insights), label: 'How Am I Doing?'),
        ],
      ),
    );
  }
}
