# Study House API

A Pub/Sub backend with a Graph data model that utilizes having 1 data service and all communication is done using a message queue. Each data change is an event that is sent to the queue for services to react to. The only API endpoints available are CRUD operations and search. All logic is done through logic rules that are triggered by data changes.

The code is sttrucutred to be agnostic of what database/cache/email provider/search engine/...etc is used. It is structured in a plug-n-play style to move easily between external components and have different configurations for different use cases. 

## Technical Documentation

- [How tracing works](https://adorable-busby-fbf.notion.site/Tracing-1c43e38aa46142389c200a017e8323bc?pvs=4)
- [Data service documentation](https://adorable-busby-fbf.notion.site/Model-Processors-acd1bc9d3b50408eaeddb5b37fdf4591?pvs=4)

## Project Documentation
- [Feature Summaries](https://doc.clickup.com/36248482/d/h/12j6x2-300/204a237108bd788)
- [Objects](https://doc.clickup.com/36248482/d/h/12j6x2-280/9ebf63fe0e2bbca)
- [Logic Rules](https://doc.clickup.com/36248482/d/h/12j6x2-200/9200522d71b9856)
- [Search](https://doc.clickup.com/36248482/d/h/12j6x2-520/491ffeced25a7f4)
- [Notification Models](https://doc.clickup.com/36248482/d/h/12j6x2-500/88fb68dd6a4ebf8)
- [End-to-end tests](https://doc.clickup.com/36248482/d/h/12j6x2-540/da12b61130236cf)
