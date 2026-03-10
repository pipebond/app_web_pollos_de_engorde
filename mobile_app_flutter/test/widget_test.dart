import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app_flutter/src/pollos_app.dart';

void main() {
  testWidgets('renderiza app de pollos', (WidgetTester tester) async {
    await tester.pumpWidget(const PollosApp());
    await tester.pump();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
