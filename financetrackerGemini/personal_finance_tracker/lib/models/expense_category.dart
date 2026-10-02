// Defines the enum of the 5 required expense categories.
enum ExpenseCategory {
  food('Food'),
  entertainment('Entertainment'),
  transportation('Transportation'),
  rentMortgage('Rent/Mortgage'),
  miscellaneous('Miscellaneous');

  final String displayName;
  const ExpenseCategory(this.displayName);
}
