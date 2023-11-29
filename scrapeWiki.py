import requests
from bs4 import BeautifulSoup
import json
import re

def get_infobox_data(url):
    try:
        page = requests.get(url)
        soup = BeautifulSoup(page.content, 'html.parser')
        infobox = soup.find('table', {'class': 'infobox'})
        info_data = {}

        if infobox:
            for row in infobox.find_all('tr'):
                header = row.find('th')
                if header:
                    key = header.text.strip()
                    value = row.find('td')
                    if value:
                        raw_text = ' '.join(value.text.split())  # Removing extra whitespaces and newline characters
                        formatted_text = format_text(raw_text)
                        info_data[key] = formatted_text

        return info_data
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return {}

def get_subdivisions_and_dialects(url):
    try:
        page = requests.get(url)
        soup = BeautifulSoup(page.content, 'html.parser')
        infobox = soup.find('table', {'class': 'infobox'})
        if infobox:
            links = []
            for section_title in ['Subdivisions', 'Dialects']:
                section = infobox.find('th', string=section_title)
                if section:
                    list_items = section.find_next_sibling('td').find('ul')
                    if list_items:
                        links.extend([a['href'] for a in list_items.find_all('a') if a['href'].startswith('/wiki/')])
            return links
        return []
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return []

def format_text(text):
    # Insert a comma and space between concatenated words (lowercase followed by uppercase)
    formatted_text = re.sub(r'([a-z])([A-Z])', r'\1, \2', text)
    return formatted_text


def create_node(url):
    info_data = get_infobox_data(url)
    node_name = url.split('/')[-1].replace('_', ' ')  # Extracting name from URL
    return {'name': node_name, 'info': info_data, 'children': []}

def add_children(node, subdivisions):
    for sub_url in subdivisions:
        full_url = 'https://en.wikipedia.org' + sub_url
        child_node = create_node(full_url)
        node['children'].append(child_node)
        child_subdivisions = get_subdivisions_and_dialects(full_url)
        add_children(child_node, child_subdivisions)

# Starting URL (change this to your desired root language page)
start_url = 'https://en.wikipedia.org/wiki/Semitic_languages'
root_node = create_node(start_url)
add_children(root_node, get_subdivisions_and_dialects(start_url))

# Writing the hierarchical data to a JSON file
with open('Semitic_languages_hierarchy.json', 'w') as file:
    json.dump(root_node, file, indent=2)
