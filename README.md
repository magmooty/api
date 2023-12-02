# Study House API

A Pub/Sub backend with a Graph data model that utilizes having 1 data service and all communication is done using a message queue. Each data change is an event that is sent to the queue for services to react to. The only API endpoints available are CRUD operations and search. All logic is done through logic rules that are triggered by data changes.
