#!/usr/bin/env node

const program = require("commander");
const {prompt} = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const clear = require("clear");
const fs = require("fs-extra");
const path = require("path");

const dataFilePath = path.join(__dirname, "data.json");

if (!fs.existsSync(dataFilePath)) {
  fs.writeJsonSync(dataFilePath, {items: []});
}

clear();
console.log(
  chalk.yellow(figlet.textSync("CRUD CLI", {horizontalLayout: "full"}))
);

const questions = [
  {
    type: "input",
    name: "name",
    message: "Enter name:",
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter a name";
      }
    },
  },
  {
    type: "input",
    name: "description",
    message: "Enter description:",
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter a description";
      }
    },
  },
];

const dataOps = {
  getItems: () => {
    const data = fs.readJsonSync(dataFilePath);
    return data.items;
  },
  saveItems: (items) => {
    fs.writeJsonSync(dataFilePath, {items});
  },
  addItem: (item) => {
    const items = dataOps.getItems();
    item.id = Date.now().toString();
    items.push(item);
    dataOps.saveItems(items);
    return item;
  },
  findItem: (id) => {
    const items = dataOps.getItems();
    return items.find((item) => item.id === id);
  },
  updateItem: (id, updatedItem) => {
    const items = dataOps.getItems();
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items[index] = {...items[index], ...updatedItem, id};
      dataOps.saveItems(items);
      return items[index];
    }
    return null;
  },
  deleteItem: (id) => {
    const items = dataOps.getItems();
    const filteredItems = items.filter((item) => item.id !== id);
    if (filteredItems.length !== items.length) {
      dataOps.saveItems(filteredItems);
      return true;
    }
    return false;
  },
};

program.version("1.0.0").description("CRUD CLI Application");

program
  .command("create")
  .alias("c")
  .description("Add a new item")
  .action(() => {
    prompt(questions).then((answers) => {
      const item = dataOps.addItem(answers);
      console.log(chalk.green("Item added successfully:"));
      console.log(chalk.cyan(JSON.stringify(item, null, 2)));
    });
  });

program
  .command("list")
  .alias("l")
  .description("List all items")
  .action(() => {
    const items = dataOps.getItems();
    if (items.length === 0) {
      console.log(chalk.yellow("No items found"));
      return;
    }
    console.log(chalk.green("Items:"));
    items.forEach((item) => {
      console.log(chalk.cyan(`ID: ${item.id}`));
      console.log(chalk.cyan(`Name: ${item.name}`));
      console.log(chalk.cyan(`Description: ${item.description}`));
      console.log(chalk.cyan("-".repeat(20)));
    });
  });

program
  .command("find <id>")
  .alias("f")
  .description("Find an item by ID")
  .action((id) => {
    const item = dataOps.findItem(id);
    if (item) {
      console.log(chalk.green("Item found:"));
      console.log(chalk.cyan(JSON.stringify(item, null, 2)));
    } else {
      console.log(chalk.red(`Item with ID ${id} not found`));
    }
  });

program
  .command("update <id>")
  .alias("u")
  .description("Update an item")
  .action((id) => {
    const item = dataOps.findItem(id);
    if (!item) {
      console.log(chalk.red(`Item with ID ${id} not found`));
      return;
    }

    const updateQuestions = questions.map((q) => ({
      ...q,
      default: item[q.name],
    }));

    prompt(updateQuestions).then((answers) => {
      const updatedItem = dataOps.updateItem(id, answers);
      console.log(chalk.green("Item updated successfully:"));
      console.log(chalk.cyan(JSON.stringify(updatedItem, null, 2)));
    });
  });

program
  .command("delete <id>")
  .alias("d")
  .description("Delete an item")
  .action((id) => {
    prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete item with ID ${id}?`,
        default: false,
      },
    ]).then((answers) => {
      if (answers.confirm) {
        const deleted = dataOps.deleteItem(id);
        if (deleted) {
          console.log(chalk.green(`Item with ID ${id} deleted successfully`));
        } else {
          console.log(chalk.red(`Item with ID ${id} not found`));
        }
      } else {
        console.log(chalk.yellow("Delete operation cancelled"));
      }
    });
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
