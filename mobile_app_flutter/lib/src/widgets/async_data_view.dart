import "package:flutter/material.dart";

class AsyncDataView extends StatelessWidget {
  final bool loading;
  final String? error;
  final List<Map<String, dynamic>> items;
  final Future<void> Function() onRefresh;

  const AsyncDataView({
    super.key,
    required this.loading,
    required this.error,
    required this.items,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(error!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: onRefresh,
                child: const Text("Reintentar"),
              ),
            ],
          ),
        ),
      );
    }

    if (items.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          children: const [
            SizedBox(height: 120),
            Center(child: Text("Sin registros")),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final item = items[index];
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children:
                    item.entries
                        .map(
                          (entry) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(
                              "${entry.key}: ${entry.value}",
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
              ),
            ),
          );
        },
      ),
    );
  }
}
