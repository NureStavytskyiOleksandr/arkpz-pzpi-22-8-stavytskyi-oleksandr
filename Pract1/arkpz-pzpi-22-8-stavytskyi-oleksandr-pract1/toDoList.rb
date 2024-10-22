# Клас Task представляє завдання в TODO списку
class Task
  attr_accessor :description, :completed

  def initialize(description)
    @description = description
    @completed = false
  end

  def complete!
    @completed = true
  end

  def to_s
    status = @completed ? "[x]" : "[ ]"
    "#{status} #{@description}"
  end
end

# Клас TodoList представляє список завдань
class TodoList
  def initialize
    @tasks = []
  end

  def add_task(description)
    task = Task.new(description)
    @tasks << task
    puts "Завдання '#{description}' додано до списку."
  end

  def remove_task(index)
    if valid_index?(index)
      task = @tasks.delete_at(index)
      puts "Завдання '#{task.description}' видалено."
    else
      puts "Невірний індекс завдання."
    end
  end

  def complete_task(index)
    if valid_index?(index)
      @tasks[index].complete!
      puts "Завдання '#{@tasks[index].description}' відмічено як виконане."
    else
      puts "Невірний індекс завдання."
    end
  end

  def list_tasks
    if @tasks.empty?
      puts "Ваш список завдань порожній."
    else
      @tasks.each_with_index do |task, index|
        puts "#{index + 1}. #{task}"
      end
    end
  end

  private

  def valid_index?(index)
    index >= 0 && index < @tasks.length
  end
end

# Основна логіка CLI додатку
class TodoApp
  def initialize
    @todo_list = TodoList.new
  end

  def run
    loop do
      print_menu
      input = gets.chomp
      case input
      when '1'
        add_task
      when '2'
        remove_task
      when '3'
        complete_task
      when '4'
        @todo_list.list_tasks
      when '5'
        puts "Вихід з програми. До побачення!"
        break
      else
        puts "Невірна команда. Спробуйте ще раз."
      end
    end
  end

  private

  def print_menu
    puts "\n--- TODO Список ---"
    puts "1. Додати завдання"
    puts "2. Видалити завдання"
    puts "3. Відмітити завдання як виконане"
    puts "4. Показати всі завдання"
    puts "5. Вийти"
    print "Виберіть опцію: "
  end

  def add_task
    print "Введіть опис завдання: "
    description = gets.chomp
    @todo_list.add_task(description)
  end

  def remove_task
    print "Введіть номер завдання для видалення: "
    index = gets.chomp.to_i - 1
    @todo_list.remove_task(index)
  end

  def complete_task
    print "Введіть номер завдання для відмітки як виконаного: "
    index = gets.chomp.to_i - 1
    @todo_list.complete_task(index)
  end
end

# Запуск програми
app = TodoApp.new
app.run
