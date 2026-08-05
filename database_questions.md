# Database Questions

[Basic SQL Emulator](https://www.w3schools.com/sql/trysql.asp?filename=trysql_select_all)

## Level 1

Write a SQL query that shows me how many customers there are from Germany.

```sql
SELECT COUNT(*) AS GermanyCustomerCount
FROM Customers
WHERE Country = 'Germany';
```

## Level 2

Write a query that shows me a list of the countries that have the most customers; from most customers to least customers.  Don’t show countries that have less than 5 customers.

```sql
SELECT COUNT(*) AS CustomerCount, Country
FROM Customers
GROUP BY Country
HAVING COUNT(*) >= 5
ORDER BY CustomerCount DESC;
```

## Level 3

Reverse Engineer These Results (tell me the query that we need to write to get these results):

| CustomerName | OrderCount | FirstOrder | LastOrder |
| :--- | :--- | :--- | :--- |
| Ernst Handel | 10 | 1996-07-17 | 1997-02-11 |
| Mère Paillarde | 5 | 1996-10-17 | 1997-02-07 |
| Wartian Herkku | 7 | 1996-07-26 | 1997-02-05 |
| Split Rail Beer & Ale | 6 | 1996-08-01 | 1997-01-31 |
| Hungry Owl All-Night Grocers | 6 | 1996-09-05 | 1997-01-29 |
| La maison dAsie | 5 | 1996-11-11 | 1997-01-24 |
| QUICK-Stop | 7 | 1996-08-05 | 1997-01-17 |
| Rattlesnake Canyon Grocery | 7 | 1996-07-22 | 1997-01-01 |
| LILA-Supermercado | 5 | 1996-08-16 | 1996-12-12 |

```sql
SELECT 
    c.CustomerName, 
    COUNT(o.OrderID) AS OrderCount, 
    MIN(o.OrderDate) AS FirstOrder, 
    MAX(o.OrderDate) AS LastOrder
FROM Customers c
JOIN Orders o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerName
HAVING COUNT(o.OrderID) >= 5
ORDER BY LastOrder DESC;
```
