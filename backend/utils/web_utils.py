import requests
from bs4 import BeautifulSoup
import logging
import re
from typing import Optional, Dict, Any, Union, List, Set
from urllib.parse import urljoin, urlparse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_website_content(url: str) -> str:
    """
    Extract content from a website URL
    
    Args:
        url: The URL to extract content from
        
    Returns:
        Extracted text content
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return f"Error: Failed to fetch {url}, status code: {response.status_code}"
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Remove script and style elements
        for script in soup(["script", "style", "header", "footer", "nav"]):
            script.extract()
        
        # Get the title and description
        title = soup.title.text.strip() if soup.title else "No title found"
        meta_desc = soup.find("meta", attrs={"name": "description"})
        description = meta_desc.get("content", "") if meta_desc else ""
        
        # Get the main content
        # First, try to find the main content container
        main_content = soup.find("main") or soup.find("article") or soup.find("div", class_=re.compile("content|main", re.I))
        
        if main_content:
            text = main_content.get_text(separator="\n")
        else:
            # If no main content container found, get all text
            text = soup.get_text(separator="\n")
        
        # Clean up the text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = "\n".join(chunk for chunk in chunks if chunk)
        
        # Prepare the result
        full_content = f"Title: {title}\n\nDescription: {description}\n\nContent:\n{text}"
        
        return full_content
        
    except Exception as e:
        logger.error(f"Error extracting content from {url}: {str(e)}")
        return f"Error extracting content: {str(e)}"

def extract_links(url: str) -> List[str]:
    """
    Extract links from a webpage
    
    Args:
        url: The URL to extract links from
        
    Returns:
        A list of absolute URLs
    """
    try:
        # Make sure URL has scheme
        if not urlparse(url).scheme:
            url = f"https://{url}"
        
        # Fetch webpage
        response = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            timeout=10
        )
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, "lxml")
        
        # Find all links
        links = []
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            
            # Skip anchor links, javascript, and mailto
            if href.startswith("#") or href.startswith("javascript:") or href.startswith("mailto:"):
                continue
            
            # Convert relative URLs to absolute
            absolute_url = urljoin(url, href)
            
            # Only include links from the same domain
            if urlparse(absolute_url).netloc == urlparse(url).netloc:
                links.append(absolute_url)
        
        # Remove duplicates
        return list(set(links))
        
    except Exception as e:
        logger.error(f"Error extracting links from {url}: {str(e)}")
        return []

def extract_website_with_subpages(url: str, max_pages: int = 5) -> str:
    """
    Extract content from a website URL including linked subpages
    
    Args:
        url: The main URL to extract
        max_pages: Maximum number of pages to extract
        
    Returns:
        Combined text content from all pages
    """
    # Keep track of visited URLs
    visited_urls: Set[str] = set()
    all_content = []
    
    def should_visit(link: str) -> bool:
        """Check if the link should be visited"""
        # Parse the original URL and the link
        original_domain = urlparse(url).netloc
        link_domain = urlparse(link).netloc
        
        # Only follow links from the same domain
        if original_domain != link_domain:
            return False
        
        # Avoid visiting the same URL twice
        if link in visited_urls:
            return False
        
        # Avoid common file types
        if any(ext in link.lower() for ext in ['.pdf', '.jpg', '.png', '.gif', '.zip']):
            return False
            
        return True
    
    def extract_links(html_content: str, base_url: str) -> List[str]:
        """Extract links from HTML content"""
        soup = BeautifulSoup(html_content, 'lxml')
        links = []
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            # Create absolute URL
            full_url = urljoin(base_url, href)
            if should_visit(full_url):
                links.append(full_url)
                
        return links
    
    # Start with the main URL
    main_queue = [url]
    visited_urls.add(url)
    
    # Extract content from the main page
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Extract content from the main page
            main_content = extract_website_content(url)
            all_content.append(f"--- MAIN PAGE: {url} ---\n{main_content}")
            
            # Extract links from the main page
            links = extract_links(response.text, url)
            
            # Visit subpages up to max_pages
            pages_visited = 1
            for link in links:
                if pages_visited >= max_pages:
                    break
                    
                if link not in visited_urls:
                    visited_urls.add(link)
                    try:
                        logger.info(f"Extracting content from subpage: {link}")
                        subpage_content = extract_website_content(link)
                        all_content.append(f"--- SUBPAGE: {link} ---\n{subpage_content}")
                        pages_visited += 1
                    except Exception as sub_err:
                        logger.error(f"Error extracting content from subpage {link}: {str(sub_err)}")
    
    except Exception as e:
        logger.error(f"Error in extract_website_with_subpages for {url}: {str(e)}")
        return extract_website_content(url)  # Fallback to single page extraction
    
    # Combine all content
    combined_content = "\n\n".join(all_content)
    
    return combined_content 