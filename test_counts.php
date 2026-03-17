<?php
use App\Models\User;
use App\Models\Category;
use App\Models\RecurringBill;
use App\Models\MonthlyBill;

$user = User::first();

$cat = new Category(['name' => 'Teste Categoria']);
$cat->user_id = $user->id;
$cat->color = 'blue';
$cat->icon = 'tag';
$cat->budget_group = 'needs';
$cat->save();

echo "Initial Category MonthlyBills Count: " . $cat->monthlyBills()->count() . "\n";
echo "Initial Category RecurringBills Count: " . $cat->recurringBills()->count() . "\n";

$recurring = new RecurringBill([
    'category_id' => $cat->id,
    'name' => 'Teste Recorrente',
    'expected_amount' => 100,
    'due_day' => 10,
    'active' => true
]);
$recurring->user_id = $user->id;
$recurring->save();

echo "After Creating Recurring - RecurringBills Count: " . $cat->recurringBills()->count() . "\n";

$monthly = new MonthlyBill([
    'category_id' => $cat->id,
    'recurring_bill_id' => $recurring->id,
    'year' => date('Y'),
    'month' => date('n'),
    'name_snapshot' => 'Teste Mensal',
    'expected_amount' => 100,
    'due_date' => date('Y-m-d'),
    'status' => 'pending'
]);
$monthly->user_id = $user->id;
$monthly->save();

echo "After Creating Monthly - MonthlyBills Count: " . $cat->monthlyBills()->count() . "\n";

$recurring->delete(); // Soft delete it

echo "After Deleting Recurring - RecurringBills Count: " . $cat->recurringBills()->count() . "\n";

$monthly->delete();

echo "After Deleting Monthly - MonthlyBills Count: " . $cat->monthlyBills()->count() . "\n";

$cat->forceDelete();
$recurring->forceDelete();
$monthly->forceDelete();
