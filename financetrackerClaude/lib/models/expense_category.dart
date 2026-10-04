enum ExpenseCategory {
  food('Food'),
  entertainment('Entertainment'),
  transportation('Transportation'),
  rentMortgage('Rent/Mortgage'),
  miscellaneous('Miscellaneous');

  const ExpenseCategory(this.label);

  final String label;
}
